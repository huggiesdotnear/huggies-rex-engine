// ========================================
// SESSIONS_ROUTE
// POST /api/huggies/sessions — turn signed messages into session keys.
//
// the browser sends every account it holds a signature for. the backend
// verifies each signature against the exact message + nonce + recipient
// that was signed, and then hands back ONE KEY PER ACCOUNT.
//
// 400 = the body was empty, or an account's signature did not verify.
// 500 = the db could not be reached.
//
// --- WHY --- ONE KEY PER ACCOUNT and not one per person: an account has
// exactly one key, and the account id is the row's identity. a key that
// served several accounts could not be narrowed to one wallet, and it
// could not be rotated for one account without affecting the others.
//
// --- WHY --- the accounts are all verified before ANY key is made: a
// body with one good signature and one forged one is a body that must be
// refused as a whole. handing out a key for the good half would make the
// forged half pointless to forge.
//
// --- WHY --- an account that already has a session gets the SAME key
// back: signing in on another device must not invalidate the first
// device. so the key lives in the db, keyed by the account, and a later
// sign-in reads it back out.
use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use sqlx::SqlitePool;

use crate::backend::logic::endpoint_huggies_sessions::{
    nep413_verify_fun::{NEP413_SIGNED_MESSAGE, NEP413_VERIFY_ERROR, nep413_verify_fun},
    session_key_fun::{session_key_generate_fun, session_key_hash_fun},
    sessions_store::{session_get_fun, session_upsert_fun},
};
use crate::backend::types::sessions_request::{
    SESSION_KEY_ENTRY, SESSIONS_REQUEST, SESSIONS_RESPONSE,
};
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
    //
    // --- WHY --- a duplicate account id is refused and not ignored: the
    // body would carry two signatures for one account, and which one
    // wins would be a coin toss. a wallet that exposes an account twice
    // is a wallet that is confused.
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
        if account_ids.contains(&account.account_id) {
            return huggies_error_fun(
                StatusCode::BAD_REQUEST,
                "duplicate_account",
                &format!("{} was sent twice", account.account_id),
            )
            .into_response();
        }
        account_ids.push(account.account_id.clone());
    }

    // --- THE KEYS -------------------------
    // one key per account, and every key is made before any of them is
    // handed back — so a failure halfway through does not leave the
    // reader holding some keys and not others.
    let mut keys: Vec<SESSION_KEY_ENTRY> = Vec::with_capacity(account_ids.len());
    for account_id in &account_ids {
        let entry = match account_key_fun(&pool, account_id).await {
            Ok(entry) => entry,
            Err(err) => {
                eprintln!("[sessions] could not make the key for {account_id}: {err}");
                return huggies_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "db_unavailable",
                    "the session key could not be made",
                )
                .into_response();
            }
        };
        keys.push(entry);
    }

    (StatusCode::OK, Json(SESSIONS_RESPONSE { keys })).into_response()
}
// ========================================
// --- HELPERS ----------------------------
// the key for one account: the one it already has, or a new one.
//
// --- WHY --- this is async and takes the pool: it reads the account's
// row, and that read can fail.
async fn account_key_fun(
    pool: &SqlitePool,
    account_id: &str,
) -> Result<SESSION_KEY_ENTRY, sqlx::Error> {
    let existing = session_get_fun(pool, account_id).await?;

    // --- WHY --- an existing account's key is handed back unchanged: the
    // account has exactly one key, and a second device signing in must
    // get that same key, not a new one. a new key would invalidate the
    // first device.
    let (session_key, created) = match &existing {
        Some(session) => (session.session_key.clone(), false),
        None => (session_key_generate_fun(), true),
    };

    let session_key_hash = session_key_hash_fun(&session_key);

    session_upsert_fun(pool, account_id, &session_key, &session_key_hash).await?;

    Ok(SESSION_KEY_ENTRY {
        account_id: account_id.to_string(),
        session_key,
        created,
    })
}

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
        NEP413_VERIFY_ERROR::MalformedPublicKey => {
            "the public key was not an ed25519 key".to_string()
        }
        NEP413_VERIFY_ERROR::MalformedNonce => "the nonce was not 32 bytes".to_string(),
        NEP413_VERIFY_ERROR::SignatureMismatch => {
            "the signature does not match the message".to_string()
        }
    }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
