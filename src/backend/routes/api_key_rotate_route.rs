// ========================================
// API_KEY_ROTATE_ROUTE
// POST /api/shit-1170/api-key/rotate — give an account a NEW api key.
//
// the reader asks for a new key for an account. the old key stops
// working at once, and the new one takes its place.
//
// 400 = the body was empty, or the account's signature did not verify.
// 404 = the account has no api key to rotate.
// 500 = the db could not be reached.
//
// --- WHY --- the request carries a SIGNED MESSAGE and not the old key:
// the old key is what a thief has. if a rotation only needed the old
// key, a thief could rotate it and lock the owner out while keeping
// access. the signed message proves the owner still holds the account's
// NEAR key.
//
// --- WHY --- no wallet popup is needed: the browser already holds the
// signed message in its local storage from the sign-in, and the
// signature covers the message + nonce + recipient. re-signing would
// give a fresher nonce, but the signed message in hand is what proves
// the ownership, and the reader asked for a rotation on purpose.
//
// --- WHY --- the old key dies at once and not after a grace window:
// the point of a rotation is that the old key stops working. a grace
// window would mean a stolen key keeps working for that window.
use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::backend::logic::endpoint_shit_1170_api_keys::{
    api_key_fun::{api_key_generate_fun, api_key_hash_fun},
    api_keys_store::{api_key_get_fun, api_key_rotate_fun},
    nep413_verify_fun::{NEP413_SIGNED_MESSAGE, NEP413_VERIFY_ERROR, nep413_verify_fun},
};
use crate::backend::logic::feed_ws::app_state::APP_STATE;
use crate::backend::types::api_keys_request::{API_KEY_ENTRY, API_KEYS_REQUEST};
// ========================================
pub async fn api_key_rotate_route(
    State(state): State<APP_STATE>,
    Json(body): Json<API_KEYS_REQUEST>,
) -> Response {
    // --- WHY --- THE POOL IS TAKEN OUT OF THE STATE: the router's
    // state holds the pool and the feed bus, and this route needs
    // the pool. the bus is not needed here.
    let pool = state.pool.clone();
    if body.accounts.is_empty() {
        return shit_1170_error_fun(
            StatusCode::BAD_REQUEST,
            "no_accounts",
            "the request carried no signed accounts",
        )
        .into_response();
    }

    // a rotation is for ONE account. the browser sends the account it
    // wants rotated; if it sends several, the first one is rotated and
    // the rest are ignored — no, better to refuse: a rotation that
    // silently rotates one of three is a surprise.
    if body.accounts.len() > 1 {
        return shit_1170_error_fun(
            StatusCode::BAD_REQUEST,
            "too_many_accounts",
            "a rotation is for one account at a time",
        )
        .into_response();
    }

    let account = &body.accounts[0];
    let signed = NEP413_SIGNED_MESSAGE {
        account_id: account.account_id.clone(),
        public_key: account.public_key.clone(),
        signature: account.signature.clone(),
        message: account.message.clone(),
        nonce: account.nonce.clone(),
        recipient: account.recipient.clone(),
    };
    if let Err(reason) = nep413_verify_fun(&signed) {
        return shit_1170_error_fun(
            StatusCode::BAD_REQUEST,
            "signature_invalid",
            &format!("{}: {}", account.account_id, verify_reason_fun(&reason)),
        )
        .into_response();
    }

    // the account has to HAVE an api key — a rotation replaces a key, it
    // does not make one.
    match api_key_get_fun(&pool, &account.account_id).await {
        Ok(Some(_)) => {}
        Ok(None) => {
            return shit_1170_error_fun(
                StatusCode::NOT_FOUND,
                "no_api_key",
                &format!("{} has no api key to rotate", account.account_id),
            )
            .into_response();
        }
        Err(err) => {
            eprintln!("[api-key] could not read the api key: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the api key could not be read",
            )
            .into_response();
        }
    }

    // the new key.
    let api_key = api_key_generate_fun();
    let api_key_hash = api_key_hash_fun(&api_key);

    let rotated = api_key_rotate_fun(&pool, &account.account_id, &api_key, &api_key_hash).await;
    if let Err(err) = rotated {
        eprintln!("[api-key] could not rotate the api key: {err}");
        return shit_1170_error_fun(
            StatusCode::INTERNAL_SERVER_ERROR,
            "db_unavailable",
            "the api key could not be rotated",
        )
        .into_response();
    }

    (
        StatusCode::OK,
        Json(API_KEY_ENTRY {
            account_id: account.account_id.clone(),
            api_key,
            created: true,
        }),
    )
        .into_response()
}
// ========================================
// --- HELPERS ----------------------------
// the one json error shape every failure of this route answers with.
fn shit_1170_error_fun(status: StatusCode, code: &str, message: &str) -> impl IntoResponse {
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
