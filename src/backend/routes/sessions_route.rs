// ========================================
// SESSIONS_ROUTE
// POST /api/huggies/sessions — turn signed messages into a session key.
//
// the browser sends every account it holds a signature for. the backend
// verifies each signature against the exact message + nonce + recipient
// that was signed, and then hands back ONE session key for the user.
//
// 400 = the body was empty, or an account's signature did not verify.
// 500 = the db could not be reached, or the session key could not be
// encrypted.
//
// --- WHY --- ONE key for the whole user and not one per account: the
// user is the person, and the person has one key. the accounts are the
// person's wallets, and they ride along in the session's account list.
//
// --- WHY --- the accounts are all verified before ANY key is made: a
// body with one good signature and one forged one is a body that must be
// refused as a whole. handing out a key for the good half would make the
// forged half pointless to forge.
//
// --- WHY --- a user with an existing session gets the SAME key back:
// signing in on another device must not invalidate the first device. so
// the key lives in the db, keyed by the user, and a later sign-in reads
// it back out.
use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use sqlx::SqlitePool;

use crate::backend::logic::{
    nep413_verify_fun::{NEP413_SIGNED_MESSAGE, NEP413_VERIFY_ERROR, nep413_verify_fun},
    session_key_fun::{
        session_key_decrypt_fun, session_key_encrypt_fun, session_key_generate_fun,
        session_key_hash_fun,
    },
    session_secret_fun::session_secret_fun,
    sessions_store::{session_get_fun, session_upsert_fun},
};
use crate::backend::types::sessions_request::{SESSIONS_REQUEST, SESSIONS_RESPONSE};
// ========================================
pub async fn sessions_route(
    State(pool): State<SqlitePool>,
    Json(body): Json<SESSIONS_REQUEST>,
) -> Response {
    if body.accounts.is_empty() {
        return huggies_error_fun(
            StatusCode::BAD_REQUEST,
            "no_accounts",
            "the request carried no signed accounts",
        )
        .into_response();
    }

    // --- VERIFY ----------------------------
    // every account's signature has to verify before a key is made.
    let mut account_ids: Vec<String> = Vec::with_capacity(body.accounts.len());
    for account in &body.accounts {
        let signed = NEP413_SIGNED_MESSAGE {
            account_id: account.account_id.clone(),
            public_key: account.public_key.clone(),
            signature: account.signature.clone(),
            message: account.message.clone(),
            nonce: account.nonce.clone(),
            recipient: account.recipient.clone(),
        };
        if let Err(reason) = nep413_verify_fun(&signed) {
            return huggies_error_fun(
                StatusCode::BAD_REQUEST,
                "signature_invalid",
                &format!("{}: {}", account.account_id, verify_reason_fun(&reason)),
            )
            .into_response();
        }
        if !account_ids.contains(&account.account_id) {
            account_ids.push(account.account_id.clone());
        }
    }

    // --- THE USER --------------------------
    // the user is the FIRST account: the one the browser is acting as.
    //
    // --- WHY --- the first and not the first alphabetically or the first in
    // the db: the browser sends its accounts in a stable order and the
    // first one is the active account. a user id has to be the SAME on
    // every device, or the second device would create a second user with a
    // second key.
    let user_id = account_ids[0].clone();

    // --- THE KEY --------------------------
    // the existing session, if the user has one.
    let existing = match session_get_fun(&pool, &user_id).await {
        Ok(existing) => existing,
        Err(err) => {
            eprintln!("[sessions] could not read the session: {err}");
            return huggies_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the session could not be read",
            )
            .into_response();
        }
    };

    // the secret the key is encrypted with.
    let secret = match session_secret_fun() {
        Ok(secret) => secret,
        Err(err) => {
            eprintln!("[sessions] the session secret is not available: {err}");
            return huggies_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "no_session_secret",
                "the session key cannot be encrypted",
            )
            .into_response();
        }
    };

    // the key, and whether this call made it.
    //
    // --- WHY --- an existing user's key is DECRYPTED and handed back
    // unchanged: the user has exactly one key, and a second device
    // signing in must get that same key, not a new one. a new key would
    // invalidate the first device.
    let (session_key, created) = match &existing {
        Some(session) => match session_key_decrypt_fun(secret, &session.session_key_encrypted) {
            Ok(session_key) => (session_key, false),
            Err(err) => {
                // the db holds a key this build cannot read — the secret
                // changed, or the row is damaged. it is NOT silently replaced:
                // a new key would lock the user out of every other device.
                eprintln!("[sessions] the stored session key could not be decrypted: {err}");
                return huggies_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "session_key_unreadable",
                    "the stored session key could not be decrypted",
                )
                .into_response();
            }
        },
        None => (session_key_generate_fun(), true),
    };

    let session_key_hash = session_key_hash_fun(&session_key);
    let session_key_encrypted = match session_key_encrypt_fun(secret, &session_key) {
        Ok(encrypted) => encrypted,
        Err(err) => {
            eprintln!("[sessions] the session key could not be encrypted: {err}");
            return huggies_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "session_key_unencryptable",
                "the session key could not be encrypted",
            )
            .into_response();
        }
    };

    let saved = session_upsert_fun(
        &pool,
        &user_id,
        &session_key_encrypted,
        &session_key_hash,
        &account_ids,
    )
    .await;
    if let Err(err) = saved {
        eprintln!("[sessions] could not save the session: {err}");
        return huggies_error_fun(
            StatusCode::INTERNAL_SERVER_ERROR,
            "db_unavailable",
            "the session could not be saved",
        )
        .into_response();
    }

    (
        StatusCode::OK,
        Json(SESSIONS_RESPONSE {
            session_key,
            user_id,
            accounts: account_ids,
            created,
        }),
    )
        .into_response()
}
// ========================================
// --- HELPERS ----------------------------
// the one json error shape every failure of this route answers with.
//
// --- WHY --- the same shape the trezu proxy uses, and not a new one: the
// client parses one error envelope for the whole api.
fn huggies_error_fun(status: StatusCode, code: &str, message: &str) -> impl IntoResponse {
    (
        status,
        Json(serde_json::json!({
          "error": {
            "code": code,
            "message": message,
          }
        })),
    )
}

// the failure reason, in words the client can show.
fn verify_reason_fun(reason: &NEP413_VERIFY_ERROR) -> String {
    match reason {
        NEP413_VERIFY_ERROR::MalformedAccountId => "the account id was not valid".to_string(),
        NEP413_VERIFY_ERROR::MalformedSignature => "the signature could not be decoded".to_string(),
        NEP413_VERIFY_ERROR::MalformedNonce => "the nonce was not 32 bytes".to_string(),
        NEP413_VERIFY_ERROR::MalformedPublicKey => {
            "the public key was not an ed25519 key".to_string()
        }
        NEP413_VERIFY_ERROR::SignatureMismatch => {
            "the signature does not match the message".to_string()
        }
    }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
