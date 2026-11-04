// ========================================
// TX_QUEUE_ACCOUNTS_DELETE_ROUTE
// DELETE /api/shit-1170/tx-queue/{queue_id}/accounts/{account_id} —
// remove YOUR OWN account from a queued batch.
//
// the rule: the api key must belong to the account being removed. you
// can remove yourself from a queue, and only yourself.
//
// 200 = the account is off the queue, and the queue comes back.
// 401 = the x-api-key header is missing, or the key is not one of ours.
// 403 = the key is not that account's.
// 404 = there is no queue with that id, or the account was not on it.
// 500 = the db could not be reached.
//
// --- WHY --- a row that already carries a HASH is HISTORY and is not
// deleted: the transaction happened, and the queue shows who did it. so
// the delete only takes the rows that carry no hash.
//
// --- WHY --- the rows are removed under EVERY transaction of the batch:
// the account row hangs off the transaction, and the account leaves the
// WHO of the whole batch at once.
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use sqlx::SqlitePool;

use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_accounts_store::{
    tx_queue_accounts_delete_fun, tx_queue_accounts_has_for_account_fun,
    tx_queue_accounts_list_by_queue_fun,
};
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_caller_fun::tx_queue_caller_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_row_to_json_fun::tx_queue_row_to_json_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_store::tx_queue_get_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_transactions_store::tx_queue_transactions_list_by_queue_fun;
// ========================================
pub async fn tx_queue_accounts_delete_route(
    State(pool): State<SqlitePool>,
    headers: HeaderMap,
    Path((queue_id, account_id)): Path<(String, String)>,
) -> Response {
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
            "you may only remove your own account from a queue",
        )
        .into_response();
    }

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

    // --- WAS THE ACCOUNT ON IT -----------
    let was_on = match tx_queue_accounts_has_for_account_fun(&pool, &queue_id, &account_id).await {
        Ok(was_on) => was_on,
        Err(err) => {
            eprintln!("[tx-queue] could not read the account rows: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the accounts on the queue could not be read",
            )
            .into_response();
        }
    };
    if !was_on {
        return shit_1170_error_fun(
            StatusCode::NOT_FOUND,
            "not_on_the_queue",
            "the account is not on the queue",
        )
        .into_response();
    }

    // --- THE DELETE ----------------------
    // one call under EVERY transaction of the batch. the delete itself
    // only takes the rows that carry no hash — a sent row is history.
    let transactions = match tx_queue_transactions_list_by_queue_fun(&pool, &queue_id).await {
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

    for transaction in &transactions {
        if let Err(err) = tx_queue_accounts_delete_fun(&pool, &transaction.tx_id, &account_id).await
        {
            eprintln!("[tx-queue] could not delete the account row: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the account could not be removed from the queue",
            )
            .into_response();
        }
    }

    // --- THE ANSWER ----------------------
    let transactions = match tx_queue_transactions_list_by_queue_fun(&pool, &queue_id).await {
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

    let accounts = match tx_queue_accounts_list_by_queue_fun(&pool, &queue_id).await {
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
