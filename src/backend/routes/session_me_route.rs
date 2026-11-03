// ========================================
// SESSION_ME_ROUTE
// GET /api/huggies/session/me — who does this session key belong to.
//
// the first route that REQUIRES the session key. the reader sends the
// key in the `x-session-token` header, the backend looks it up by its
// hash, and the answer is the user the key belongs to.
//
// it exists so the automatic key handling is real and not hypothetical:
// a page that calls this route gets the key attached for it, and a
// request with no key — or a key nobody has — is refused.
//
// 200 = the key is good, and the user is named.
// 401 = the header was missing, or the key is not one of ours.
// 500 = the db could not be reached.
//
// --- WHY --- the key is looked up by its HASH and never compared: the
// db holds the hash, so the request's key is hashed and the hash is
// what is matched. the plain key is not in the db at all.
// ========================================
use axum::{
    Json,
    extract::State,
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use sqlx::SqlitePool;

use crate::backend::logic::session_key_fun::session_key_hash_fun;
use crate::backend::logic::sessions_store::session_get_by_key_hash_fun;
// ========================================
// the header the session key travels in.
const HUGGIES_SESSION_TOKEN_HEADER: &str = "x-session-token";
// ========================================
pub async fn session_me_route(State(pool): State<SqlitePool>, headers: HeaderMap) -> Response {
    // the key comes from the header, not from a query parameter: a url
    // ends up in logs and in the referer of the next page.
    let session_key = headers
        .get(HUGGIES_SESSION_TOKEN_HEADER)
        .and_then(|value| value.to_str().ok())
        .map(|value| value.trim())
        .filter(|value| !value.is_empty());

    let session_key = match session_key {
        Some(session_key) => session_key,
        None => {
            return huggies_error_fun(
                StatusCode::UNAUTHORIZED,
                "no_session_key",
                "the x-session-token header is missing",
            )
            .into_response();
        }
    };

    let session_key_hash = session_key_hash_fun(session_key);
    let found = match session_get_by_key_hash_fun(&pool, &session_key_hash).await {
        Ok(found) => found,
        Err(err) => {
            eprintln!("[session] could not read the session: {err}");
            return huggies_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the session could not be read",
            )
            .into_response();
        }
    };

    match found {
        Some(session) => (
            StatusCode::OK,
            Json(serde_json::json!({
              "accountId": session.account_id,
              "createdAt": session.created_at,
              "updatedAt": session.updated_at,
            })),
        )
            .into_response(),
        None => huggies_error_fun(
            StatusCode::UNAUTHORIZED,
            "unknown_session_key",
            "the session key is not one of ours",
        )
        .into_response(),
    }
}
// ========================================
// --- HELPERS ----------------------------
// the one json error shape every failure of this route answers with.
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
// ========================================
// copyright 2026 by sleet.near
// ========================================
