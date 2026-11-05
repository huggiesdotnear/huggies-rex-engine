// ========================================
// API_KEY_ME_ROUTE
// GET /api/shit-1170/api-key/me — who does this api key belong to.
//
// the first route that REQUIRES the api key. the reader sends the key in
// the `x-api-key` header, the backend looks it up by its hash, and the
// answer is the user the key belongs to.
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
//
// --- WHY --- the OLD `x-session-token` header still works: an agent
// built against the old name is out in the world already, and it would
// break the moment the backend stopped reading that header. during the
// beta the backend reads BOTH headers — `x-api-key` first, and the old
// one as the fallback.
use axum::{
    Json,
    extract::State,
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};

use crate::backend::logic::endpoint_shit_1170_api_keys::api_key_fun::api_key_hash_fun;
use crate::backend::logic::endpoint_shit_1170_api_keys::api_key_of_header_fun::api_key_of_header_fun;
use crate::backend::logic::endpoint_shit_1170_api_keys::api_keys_store::api_key_get_by_hash_fun;
use crate::backend::logic::feed_ws::app_state::APP_STATE;
// ========================================
pub async fn api_key_me_route(State(state): State<APP_STATE>, headers: HeaderMap) -> Response {
    // --- WHY --- THE POOL IS TAKEN OUT OF THE STATE: the router's
    // state holds the pool and the feed bus, and this route needs
    // the pool. the bus is not needed here.
    let pool = state.pool.clone();
    // the key comes from the header, not from a query parameter: a url
    // ends up in logs and in the referer of the next page.
    let api_key = match api_key_of_header_fun(&headers) {
        Some(api_key) => api_key.to_string(),
        None => {
            return shit_1170_error_fun(
                StatusCode::UNAUTHORIZED,
                "no_api_key",
                "the x-api-key header is missing",
            )
            .into_response();
        }
    };

    let api_key_hash = api_key_hash_fun(&api_key);
    let found = match api_key_get_by_hash_fun(&pool, &api_key_hash).await {
        Ok(found) => found,
        Err(err) => {
            eprintln!("[api-key] could not read the api key: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the api key could not be read",
            )
            .into_response();
        }
    };

    match found {
        Some(row) => (
            StatusCode::OK,
            Json(serde_json::json!({
              "accountId": row.account_id,
              "createdAt": row.created_at,
              "updatedAt": row.updated_at,
            })),
        )
            .into_response(),
        None => shit_1170_error_fun(
            StatusCode::UNAUTHORIZED,
            "unknown_api_key",
            "the api key is not one of ours",
        )
        .into_response(),
    }
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
// ========================================
// copyright 2026 by sleet.near
// ========================================
