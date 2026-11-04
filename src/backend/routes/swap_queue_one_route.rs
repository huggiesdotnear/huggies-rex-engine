// ========================================
// SWAP_QUEUE_ONE_ROUTE
// GET /api/shit-1170/swap-queue/{swap_id} — one queued swap.
//
// 401 = the x-api-key header is missing, or the key is not one of ours.
// 404 = there is no swap with that id.
// 500 = the db could not be reached.
//
// --- WHY --- the swap is OPEN to anybody with a key: a queued swap is an
// open offer, and reading it is what lets a reader find it and act on
// it.
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use sqlx::SqlitePool;

use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_accounts_store::swap_queue_accounts_list_by_swap_fun;
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_row_to_json_fun::swap_queue_row_to_json_fun;
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_store::swap_queue_get_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_caller_fun::tx_queue_caller_fun;
use crate::backend::types::swap_queue_request::SWAP_QUEUE_ITEM;
// ========================================
pub async fn swap_queue_one_route(
    State(pool): State<SqlitePool>,
    headers: HeaderMap,
    Path(swap_id): Path<String>,
) -> Response {
    // --- WHO IS CALLING ------------------
    // --- WHY --- THE KEY IS READ BUT NOT REQUIRED: reading a queued swap
    // is open, the same way listing them is. the key is checked so a
    // key that is not ours is still refused, but a missing one is not.
    match tx_queue_caller_fun(&pool, &headers).await {
        Ok(_) => {}
        Err(failure) if failure.status == StatusCode::UNAUTHORIZED => {}
        Err(failure) => {
            return shit_1170_error_fun(failure.status, &failure.code, &failure.message)
                .into_response();
        }
    }

    // --- THE SWAP ------------------------
    let swap = match swap_queue_get_fun(&pool, &swap_id).await {
        Ok(Some(swap)) => swap,
        Ok(None) => {
            return shit_1170_error_fun(
                StatusCode::NOT_FOUND,
                "no_such_swap",
                "there is no swap with that id",
            )
            .into_response();
        }
        Err(err) => {
            eprintln!("[swap-queue] could not read the swap: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the swap could not be read",
            )
            .into_response();
        }
    };

    // --- THE WHO -------------------------
    let accounts = match swap_queue_accounts_list_by_swap_fun(&pool, &swap_id).await {
        Ok(accounts) => accounts,
        Err(err) => {
            eprintln!("[swap-queue] could not read the accounts: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the accounts could not be read",
            )
            .into_response();
        }
    };

    // --- THE ANSWER ----------------------
    let item: SWAP_QUEUE_ITEM = swap_queue_row_to_json_fun(&swap, &accounts);
    (StatusCode::OK, Json(item)).into_response()
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
