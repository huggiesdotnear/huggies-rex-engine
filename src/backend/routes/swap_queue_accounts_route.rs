// ========================================
// SWAP_QUEUE_ACCOUNTS_ROUTE
// POST /api/shit-1170/swap-queue/{swap_id}/accounts — add YOUR OWN
// account to a queued swap.
//
// the body:
//   { "accountId": "alice.near" }
//
// the rule: the api key in the header must belong to that very account.
// you can only ever add YOURSELF.
//
// 401 = the x-api-key header is missing, or the key is not one of ours.
// 403 = the key is not this account's.
// 404 = there is no swap with that id.
// 409 = the account is already on the swap.
// 500 = the db could not be reached.
//
// --- WHY --- the key must be the account's own: the WHO list is what
// puts a swap in somebody's feed. an account that adds itself is saying
// "I want this one", and that is its own business. an account that adds
// somebody ELSE is putting a swap in somebody else's feed without them
// asking — the same spam the naming rule stops on the agent side.
//
// --- WHY --- A QUEUED SWAP NEEDS ONLY ONE ROW PER ACCOUNT: a queued
// swap is ONE swap, so there is no batch of transactions to write a row
// under. one row says "this account wants this swap".
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use sqlx::SqlitePool;

use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_accounts_store::{
    swap_queue_accounts_has_for_account_fun, swap_queue_accounts_insert_fun,
    swap_queue_accounts_list_by_swap_fun,
};
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_row_to_json_fun::swap_queue_row_to_json_fun;
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_status_fun::SHIT_1170_SWAP_QUEUE_STATUS_PENDING;
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_store::swap_queue_get_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_caller_fun::tx_queue_caller_fun;
use crate::backend::types::swap_queue_request::SWAP_QUEUE_ACCOUNT_REQUEST;
// ========================================
pub async fn swap_queue_accounts_route(
    State(pool): State<SqlitePool>,
    headers: HeaderMap,
    Path(swap_id): Path<String>,
    Json(body): Json<SWAP_QUEUE_ACCOUNT_REQUEST>,
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
    // you may only ever add YOURSELF.
    if body.account_id != caller_account_id {
        return shit_1170_error_fun(
            StatusCode::FORBIDDEN,
            "not_your_account",
            "you may only add your own account to a swap",
        )
        .into_response();
    }

    // --- THE SWAP ------------------------
    if let Err(failure) = swap_queue_exists_fun(&pool, &swap_id).await {
        return *failure;
    }

    // --- ALREADY ON IT -------------------
    let already =
        match swap_queue_accounts_has_for_account_fun(&pool, &swap_id, &body.account_id).await {
            Ok(already) => already,
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
    if already {
        return shit_1170_error_fun(
            StatusCode::CONFLICT,
            "already_on_the_queue",
            "the account is already on the swap",
        )
        .into_response();
    }

    // --- THE WRITE -----------------------
    if let Err(err) = swap_queue_accounts_insert_fun(
        &pool,
        &swap_id,
        &body.account_id,
        SHIT_1170_SWAP_QUEUE_STATUS_PENDING,
    )
    .await
    {
        eprintln!("[swap-queue] could not write the account row: {err}");
        return shit_1170_error_fun(
            StatusCode::INTERNAL_SERVER_ERROR,
            "db_unavailable",
            "the account could not be written on the swap",
        )
        .into_response();
    }

    // --- THE ANSWER ----------------------
    let item = match swap_queue_item_fun(&pool, &swap_id).await {
        Ok(item) => item,
        Err(failure) => return *failure,
    };

    (StatusCode::OK, Json(item)).into_response()
}
// ========================================
// --- HELPERS ----------------------------
// the swap has to be there.
//
// --- WHY --- a separate helper: two routes ask the same question —
// "does this swap exist?" — and the answer is a 404. it is asked BEFORE
// any write, so a swap that is not there never gets half of an account
// row written on it.
async fn swap_queue_exists_fun(pool: &SqlitePool, swap_id: &str) -> Result<(), Box<Response>> {
    match swap_queue_get_fun(pool, swap_id).await {
        Ok(Some(_)) => Ok(()),
        Ok(None) => Err(Box::new(
            shit_1170_error_fun(
                StatusCode::NOT_FOUND,
                "no_such_swap",
                "there is no swap with that id",
            )
            .into_response(),
        )),
        Err(err) => {
            eprintln!("[swap-queue] could not read the swap: {err}");
            Err(Box::new(
                shit_1170_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "db_unavailable",
                    "the swap could not be read",
                )
                .into_response(),
            ))
        }
    }
}

// the wire shape of one swap, read back from the db.
async fn swap_queue_item_fun(
    pool: &SqlitePool,
    swap_id: &str,
) -> Result<crate::backend::types::swap_queue_request::SWAP_QUEUE_ITEM, Box<Response>> {
    let swap = match swap_queue_get_fun(pool, swap_id).await {
        Ok(Some(swap)) => swap,
        Ok(None) => {
            return Err(Box::new(
                shit_1170_error_fun(
                    StatusCode::NOT_FOUND,
                    "no_such_swap",
                    "there is no swap with that id",
                )
                .into_response(),
            ));
        }
        Err(err) => {
            eprintln!("[swap-queue] could not read the swap: {err}");
            return Err(Box::new(
                shit_1170_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "db_unavailable",
                    "the swap could not be read",
                )
                .into_response(),
            ));
        }
    };

    let accounts = match swap_queue_accounts_list_by_swap_fun(pool, swap_id).await {
        Ok(accounts) => accounts,
        Err(err) => {
            eprintln!("[swap-queue] could not read the accounts: {err}");
            return Err(Box::new(
                shit_1170_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "db_unavailable",
                    "the accounts could not be read",
                )
                .into_response(),
            ));
        }
    };

    Ok(swap_queue_row_to_json_fun(&swap, &accounts))
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
