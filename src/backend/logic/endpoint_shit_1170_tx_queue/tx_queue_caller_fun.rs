// ========================================
// TX_QUEUE_CALLER_FUN
// the caller's account, from the api key in the header.
//
// every queue route starts here: the api key is the gate, and the
// account the key belongs to is who the caller is.
//
// --- WHY --- this is its own file: seven routes need the same answer —
// "who is calling?" — and the answer must be written down ONCE. if each
// route read the header itself, one of them would eventually read it
// slightly differently, and a route that forgot the 401 would be an
// open door.
//
// --- WHY --- the key comes from a HEADER and not from a query
// parameter: a url ends up in logs and in the referer of the next page,
// and a bearer token in a url is a bearer token in everybody's browser
// history.
//
// --- WHY --- a missing header and an unknown key are BOTH a 401: the
// caller did not prove who they are, and from the caller's side the two
// are the same failure.
//
// --- WHY --- the answer is the ACCOUNT and not the key: the rules of the
// queue are all about accounts — the naming rule is "the agent holds a
// key for that account", and the account rows are keyed by account.
use axum::http::{HeaderMap, StatusCode};
use sqlx::SqlitePool;

use crate::backend::logic::endpoint_shit_1170_api_keys::api_key_of_header_fun::api_key_of_header_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_auth_fun::tx_queue_account_of_caller_fun;
// ========================================
// --- TYPES ------------------------------
// the failure, in the three parts every route's error envelope carries.
#[derive(Debug, Clone)]
pub struct TX_QUEUE_CALLER_ERROR {
    // the status to answer with.
    pub status: StatusCode,
    // the machine-readable code.
    pub code: String,
    // the words the client can show.
    pub message: String,
}
// ========================================
// --- CALLER -----------------------------
// the account the caller's api key belongs to.
//
// --- WHY --- None and not an error for an unknown key: a key nobody has
// is not a broken db, it is a bad credential. the caller turns it into a
// 401.
pub async fn tx_queue_caller_fun(
    pool: &SqlitePool,
    headers: &HeaderMap,
) -> Result<String, TX_QUEUE_CALLER_ERROR> {
    let api_key = match api_key_of_header_fun(headers) {
        Some(api_key) => api_key.to_string(),
        None => {
            return Err(TX_QUEUE_CALLER_ERROR {
                status: StatusCode::UNAUTHORIZED,
                code: "no_api_key".to_string(),
                message: "the x-api-key header is missing".to_string(),
            });
        }
    };

    match tx_queue_account_of_caller_fun(pool, &api_key).await {
        Ok(Some(account_id)) => Ok(account_id),
        Ok(None) => Err(TX_QUEUE_CALLER_ERROR {
            status: StatusCode::UNAUTHORIZED,
            code: "unknown_api_key".to_string(),
            message: "the api key is not one of ours".to_string(),
        }),
        Err(err) => {
            eprintln!("[tx-queue] could not read the api key: {err}");
            Err(TX_QUEUE_CALLER_ERROR {
                status: StatusCode::INTERNAL_SERVER_ERROR,
                code: "db_unavailable".to_string(),
                message: "the api key could not be read".to_string(),
            })
        }
    }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
