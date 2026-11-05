// ========================================
// TX_QUEUE_SENT_ROUTE
// POST /api/shit-1170/tx-queue/{queue_id}/sent — record that the
// transactions were sent.
//
// the body:
//   { "txHashes": [ { "txId": "...", "txHash": "...", "status": "succeeded" } ] }
//
// ONE call for the whole batch: the wallet sent every transaction in one
// popup, so the app reports every hash in one call.
//
// 400 = there were no hashes, or a `txId` belongs to another queue, or
// a `status` was something other than `succeeded` or `failed`.
// 401 = the x-api-key header is missing, or the key is not one of ours.
// 404 = there is no queue with that id.
// 500 = the db could not be reached.
//
// --- WHY --- the account comes from the HEADER and the body does NOT
// repeat it: the key IS the account. a body that named the account
// could name somebody else's, and then the check would be a suggestion.
//
// --- WHY --- a `txId` must belong to THIS queue: the body says which
// transaction of the batch the hash belongs to, and a hash on somebody
// else's transaction would put a wrong answer on their row.
//
// --- WHY --- a MISSING status means `sent`: the outcome is not known at
// the moment the hash is written — the frontend reads it off the chain
// later and reports it back. so `sent` is a real state.
//
// --- WHY --- the account row is CREATED when it is not there: an account
// signing a queue it was NOT named on joins the WHO list. it found the
// queue, it chose it, and its send is recorded. an update would find
// nothing and the send would be lost.
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};

use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_accounts_store::{
    tx_queue_accounts_list_by_queue_fun, tx_queue_accounts_set_sent_fun,
};
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_caller_fun::tx_queue_caller_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_row_to_json_fun::tx_queue_row_to_json_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_status_fun::{
    SHIT_1170_TX_QUEUE_STATUS_FAILED, SHIT_1170_TX_QUEUE_STATUS_SENT,
    SHIT_1170_TX_QUEUE_STATUS_SUCCEEDED,
};
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_store::tx_queue_get_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_transactions_store::{
    tx_queue_transactions_get_fun, tx_queue_transactions_list_by_queue_fun,
};
use crate::backend::logic::feed_ws::app_state::APP_STATE;
use crate::backend::logic::feed_ws::feed_ws_event::FEED_WS_EVENT;
use crate::backend::logic::feed_ws::feed_ws_publish_fun::feed_ws_publish_fun;
use crate::backend::types::tx_queue_request::TX_QUEUE_SENT_REQUEST;
// ========================================
pub async fn tx_queue_sent_route(
    State(state): State<APP_STATE>,
    headers: HeaderMap,
    Path(queue_id): Path<String>,
    Json(body): Json<TX_QUEUE_SENT_REQUEST>,
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

    // --- THE HASHES ----------------------
    if body.tx_hashes.is_empty() {
        return shit_1170_error_fun(
            StatusCode::BAD_REQUEST,
            "no_tx_hashes",
            "the request carried no transaction hashes",
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

    // --- THE WRITE -----------------------
    // every entry is checked BEFORE anything is written, so a body that
    // is going to be refused never leaves half of itself in the db.
    for entry in &body.tx_hashes {
        if entry.tx_id.trim().is_empty() {
            return shit_1170_error_fun(
                StatusCode::BAD_REQUEST,
                "no_tx_id",
                "one of the entries carried no transaction id",
            )
            .into_response();
        }

        if entry.tx_hash.trim().is_empty() {
            return shit_1170_error_fun(
                StatusCode::BAD_REQUEST,
                "no_tx_hash",
                &format!("the entry for {} carries no hash", entry.tx_id),
            )
            .into_response();
        }

        // the tx id has to belong to THIS queue.
        let transaction = match tx_queue_transactions_get_fun(&pool, &entry.tx_id).await {
            Ok(Some(transaction)) => transaction,
            Ok(None) => {
                return shit_1170_error_fun(
                    StatusCode::BAD_REQUEST,
                    "tx_not_on_this_queue",
                    &format!("the transaction {} is not on this queue", entry.tx_id),
                )
                .into_response();
            }
            Err(err) => {
                eprintln!("[tx-queue] could not read the transaction: {err}");
                return shit_1170_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "db_unavailable",
                    "the transaction could not be read",
                )
                .into_response();
            }
        };
        if transaction.queue_id != queue_id {
            return shit_1170_error_fun(
                StatusCode::BAD_REQUEST,
                "tx_not_on_this_queue",
                &format!("the transaction {} is not on this queue", entry.tx_id),
            )
            .into_response();
        }

        // the status is `succeeded` or `failed`, or nothing at all.
        let status = match entry.status.as_deref() {
            None => SHIT_1170_TX_QUEUE_STATUS_SENT,
            Some(status) if status == SHIT_1170_TX_QUEUE_STATUS_SUCCEEDED => status,
            Some(status) if status == SHIT_1170_TX_QUEUE_STATUS_FAILED => status,
            Some(status) => {
                return shit_1170_error_fun(
                    StatusCode::BAD_REQUEST,
                    "bad_status",
                    &format!(
                        "{} is not a status a transaction can have — it is succeeded or failed",
                        status
                    ),
                )
                .into_response();
            }
        };

        if let Err(err) = tx_queue_accounts_set_sent_fun(
            &pool,
            &entry.tx_id,
            &caller_account_id,
            entry.tx_hash.trim(),
            status,
        )
        .await
        {
            eprintln!("[tx-queue] could not write the hash: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the hash could not be written",
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
        Ok(item) => {
            // --- THE LIVE FEED ----------------
            // the open feed pages are told that the batch was sent.
            //
            // --- WHY --- THE SAME ITEM THAT IS ANSWERED WITH: the
            // client's live post has to be byte-for-byte what a refetch
            // would give it.
            feed_ws_publish_fun(
                &state.feed_ws,
                FEED_WS_EVENT::Queue {
                    queue: item.clone(),
                },
            );

            (StatusCode::OK, Json(item)).into_response()
        }
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
