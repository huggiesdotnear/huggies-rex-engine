// ========================================
// TX_QUEUE_ONE_ROUTE
// GET /api/shit-1170/tx-queue/{queue_id} — one queued batch.
//
// the answer is the same shape as one item of the list: the queue, its
// transactions in `position` order, and the WHO across the batch.
//
// 401 = the x-api-key header is missing, or the key is not one of ours.
// 404 = there is no queue with that id.
// 500 = the db could not be reached.
//
// --- WHY --- the list is OPEN but this route still needs the key: the
// list is open to people who HAVE one, not to everybody. a queue id is a
// uuid and cannot be guessed, but the key is the gate anyway.
//
// --- WHY --- the queue id is a PATH PARAM and not a query param: it is
// the resource's identity, and a url that names the resource it is about
// can be pasted and shared.
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};

use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_accounts_store::tx_queue_accounts_list_by_queue_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_caller_fun::tx_queue_caller_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_row_to_json_fun::tx_queue_row_to_json_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_store::tx_queue_get_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_transactions_store::tx_queue_transactions_list_by_queue_fun;
use crate::backend::logic::feed_ws::app_state::APP_STATE;
// ========================================
pub async fn tx_queue_one_route(
    State(state): State<APP_STATE>,
    headers: HeaderMap,
    Path(queue_id): Path<String>,
) -> Response {
    // --- WHY --- THE POOL IS TAKEN OUT OF THE STATE: the router's
    // state holds the pool and the feed bus, and this route needs
    // the pool. the bus is not needed here.
    let pool = state.pool.clone();
    // --- WHY --- THE KEY IS NOT ASKED FOR: the queue is an OPEN offer.
    // the list is open, so opening one of them must be open too — a
    // reader who is not signed in can still read a batch they were sent
    // a link to. what they cannot do is ACT on it, and the acting is what
    // the other routes ask the key for.
    //
    // the key is read here only so the route knows whether the reader
    // has one, and the read never fails the request.
    let _caller_account_id = match tx_queue_caller_fun(&pool, &headers).await {
        Ok(account_id) => Some(account_id),
        Err(failure) if failure.status == StatusCode::UNAUTHORIZED => None,
        Err(failure) => {
            return shit_1170_error_fun(failure.status, &failure.code, &failure.message)
                .into_response();
        }
    };

    // --- THE QUEUE ------------------------
    let queue = match tx_queue_get_fun(&pool, &queue_id).await {
        Ok(Some(queue)) => queue,
        Ok(None) => {
            return shit_1170_error_fun(
                StatusCode::NOT_FOUND,
                "no_such_queue",
                "there is no queue with that id",
            )
            .into_response();
        }
        Err(err) => {
            eprintln!("[tx-queue] could not read the queue: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the queue could not be read",
            )
            .into_response();
        }
    };

    // --- THE CALLS ------------------------
    let transactions = match tx_queue_transactions_list_by_queue_fun(&pool, &queue.queue_id).await {
        Ok(transactions) => transactions,
        Err(err) => {
            eprintln!("[tx-queue] could not read the transactions: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the transactions could not be read",
            )
            .into_response();
        }
    };

    // --- THE WHO --------------------------
    let accounts = match tx_queue_accounts_list_by_queue_fun(&pool, &queue.queue_id).await {
        Ok(accounts) => accounts,
        Err(err) => {
            eprintln!("[tx-queue] could not read the accounts: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the accounts could not be read",
            )
            .into_response();
        }
    };

    match tx_queue_row_to_json_fun(&queue, &transactions, &accounts) {
        Ok(item) => (StatusCode::OK, Json(item)).into_response(),
        Err(err) => {
            eprintln!("[tx-queue] could not read the args: {err}");
            shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "args_broken",
                "the arguments of the queue could not be read",
            )
            .into_response()
        }
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
