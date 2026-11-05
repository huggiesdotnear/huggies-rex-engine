// ========================================
// SWAP_QUEUE_ACCOUNTS_DELETE_ROUTE
// DELETE /api/shit-1170/swap-queue/{swap_id}/accounts/{account_id} —
// remove YOUR OWN account from a queued swap.
//
// the rule: the api key must belong to the account being removed. you
// can remove yourself from a swap, and only yourself.
//
// 200 = the account is off the swap, and the swap comes back.
// 401 = the x-api-key header is missing, or the key is not one of ours.
// 403 = the key is not that account's.
// 404 = there is no swap with that id, or the account was not on it.
// 500 = the db could not be reached.
//
// --- WHY --- a row that already carries a HASH is HISTORY and is not
// deleted: the swap happened, and the swap shows who did it. so the
// delete only takes the row that carries no hash.
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};

use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_accounts_store::{
    swap_queue_accounts_delete_fun, swap_queue_accounts_has_for_account_fun,
    swap_queue_accounts_list_by_swap_fun,
};
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_row_to_json_fun::swap_queue_row_to_json_fun;
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_store::swap_queue_get_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_caller_fun::tx_queue_caller_fun;
use crate::backend::logic::feed_ws::app_state::APP_STATE;
use crate::backend::types::swap_queue_request::SWAP_QUEUE_ITEM;
// ========================================
pub async fn swap_queue_accounts_delete_route(
    State(state): State<APP_STATE>,
    headers: HeaderMap,
    Path((swap_id, account_id)): Path<(String, String)>,
) -> Response {
    // --- WHY --- THE POOL IS TAKEN OUT OF THE STATE: the router's
    // state holds the pool and the feed bus, and this route needs
    // the pool. the bus is not needed here.
    let pool = state.pool.clone();
    // --- WHO IS CALLING ------------------
    let caller_account_id = match tx_queue_caller_fun(&pool, &headers).await {
        Ok(account_id) => account_id,
        Err(failure) => {
            return shit_1170_error_fun(failure.status, &failure.code, &failure.message)
                .into_response();
        }
    };

    // --- THE RULE -------------------------
    // you may only ever remove YOURSELF.
    if account_id != caller_account_id {
        return shit_1170_error_fun(
            StatusCode::FORBIDDEN,
            "not_your_account",
            "you may only remove your own account from a swap",
        )
        .into_response();
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

    // --- WAS THE ACCOUNT ON IT -----------
    let was_on =
        match swap_queue_accounts_has_for_account_fun(&pool, &swap_id, &account_id).await {
            Ok(was_on) => was_on,
            Err(err) => {
                eprintln!("[swap-queue] could not read the account rows: {err}");
                return shit_1170_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "db_unavailable",
                    "the accounts on the swap could not be read",
                )
                .into_response();
            }
        };
    if !was_on {
        return shit_1170_error_fun(
            StatusCode::NOT_FOUND,
            "not_on_the_queue",
            "the account is not on the swap",
        )
        .into_response();
    }

    // --- THE DELETE ----------------------
    // the delete itself only takes the row that carries no hash — a sent
    // row is history.
    if let Err(err) = swap_queue_accounts_delete_fun(&pool, &swap_id, &account_id).await {
        eprintln!("[swap-queue] could not delete the account row: {err}");
        return shit_1170_error_fun(
            StatusCode::INTERNAL_SERVER_ERROR,
            "db_unavailable",
            "the account could not be removed from the swap",
        )
        .into_response();
    }

    // --- THE ANSWER ----------------------
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
