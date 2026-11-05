// ========================================
// TX_QUEUE_ACCOUNTS_ROUTE
// POST /api/shit-1170/tx-queue/{queue_id}/accounts — add YOUR OWN
// account to a queued batch.
//
// the body:
//   { "accountId": "alice.near" }
//
// the rule: the api key in the header must belong to that very account.
// you can only ever add YOURSELF.
//
// 401 = the x-api-key header is missing, or the key is not one of ours.
// 403 = the key is not this account's.
// 404 = there is no queue with that id.
// 409 = the account is already on the queue.
// 500 = the db could not be reached.
//
// --- WHY --- the key must be the account's own: the WHO list is what
// puts a tx in somebody's feed. an account that adds itself is saying
// "I want this one", and that is its own business. an account that adds
// somebody ELSE is putting a tx in somebody else's feed without them
// asking — the same spam the naming rule stops on the agent side.
//
// --- WHY --- the row is written under EVERY transaction of the batch:
// the account signs the whole batch in one wallet popup, and every
// transaction of that popup produces its own hash. so the account needs
// a row under each of them.
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use sqlx::SqlitePool;

use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_accounts_store::{
    tx_queue_accounts_has_for_account_fun, tx_queue_accounts_insert_fun,
    tx_queue_accounts_list_by_queue_fun,
};
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_caller_fun::tx_queue_caller_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_row_to_json_fun::tx_queue_row_to_json_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_status_fun::SHIT_1170_TX_QUEUE_STATUS_PENDING;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_store::tx_queue_get_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_transactions_store::tx_queue_transactions_list_by_queue_fun;
use crate::backend::logic::feed_ws::app_state::APP_STATE;
use crate::backend::logic::feed_ws::feed_ws_event::FEED_WS_EVENT;
use crate::backend::logic::feed_ws::feed_ws_publish_fun::feed_ws_publish_fun;
use crate::backend::types::tx_queue_request::TX_QUEUE_ACCOUNT_REQUEST;
// ========================================
pub async fn tx_queue_accounts_route(
    State(state): State<APP_STATE>,
    headers: HeaderMap,
    Path(queue_id): Path<String>,
    Json(body): Json<TX_QUEUE_ACCOUNT_REQUEST>,
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
    // you may only ever add YOURSELF.
    if body.account_id != caller_account_id {
        return shit_1170_error_fun(
            StatusCode::FORBIDDEN,
            "not_your_account",
            "you may only add your own account to a queue",
        )
        .into_response();
    }

    // --- THE QUEUE ------------------------
    if let Err(failure) = tx_queue_exists_fun(&pool, &queue_id).await {
        return *failure;
    }

    // --- ALREADY ON IT -------------------
    let already = match tx_queue_accounts_has_for_account_fun(&pool, &queue_id, &body.account_id).await
    {
        Ok(already) => already,
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
    if already {
        return shit_1170_error_fun(
            StatusCode::CONFLICT,
            "already_on_the_queue",
            "the account is already on the queue",
        )
        .into_response();
    }

    // --- THE WRITE -----------------------
    // one row under EVERY transaction of the batch.
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
        if let Err(err) = tx_queue_accounts_insert_fun(
            &pool,
            &queue_id,
            &transaction.tx_id,
            &body.account_id,
            SHIT_1170_TX_QUEUE_STATUS_PENDING,
        )
        .await
        {
            eprintln!("[tx-queue] could not write the account row: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the account could not be written on the queue",
            )
            .into_response();
        }
    }

    // --- THE ANSWER ----------------------
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
            // the open feed pages are told that the WHO of the batch
            // changed.
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
// the queue has to be there.
//
// --- WHY --- a separate helper: three routes ask the same question —
// "does this queue exist?" — and the answer is a 404. it is asked BEFORE
// any write, so a queue that is not there never gets half of an account
// row written on it.
async fn tx_queue_exists_fun(pool: &SqlitePool, queue_id: &str) -> Result<(), Box<Response>> {
    match tx_queue_get_fun(pool, queue_id).await {
        Ok(Some(_)) => Ok(()),
        Ok(None) => Err(Box::new(
            shit_1170_error_fun(
                StatusCode::NOT_FOUND,
                "no_such_queue",
                "there is no queue with that id",
            )
            .into_response(),
        )),
        Err(err) => {
            eprintln!("[tx-queue] could not read the queue: {err}");
            Err(Box::new(
                shit_1170_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "db_unavailable",
                    "the queue could not be read",
                )
                .into_response(),
            ))
        }
    }
}

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
