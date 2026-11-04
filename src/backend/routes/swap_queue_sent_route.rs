// ========================================
// SWAP_QUEUE_SENT_ROUTE
// POST /api/shit-1170/swap-queue/{swap_id}/sent — record that the swap
// was sent.
//
// the body:
//   { "txHash": "...", "status": "succeeded", "amountOut": "..." }
//
// ONE call for one swap: a swap is one transaction (or a small batch of
// them, but ONE swap), and the swap page reports the whole thing in one
// call.
//
// 400 = there was no hash, or a `status` was something other than
// `succeeded` or `failed`.
// 401 = the x-api-key header is missing, or the key is not one of ours.
// 404 = there is no swap with that id.
// 500 = the db could not be reached.
//
// --- WHY --- the account comes from the HEADER and the body does NOT
// repeat it: the key IS the account. a body that named the account
// could name somebody else's, and then the check would be a suggestion.
//
// --- WHY --- a MISSING status means `sent`: the outcome is not known at
// the moment the hash is written — the frontend reads it off the chain
// later and reports it back. so `sent` is a real state.
//
// --- WHY --- the account row is CREATED when it is not there: an account
// executing a swap it was NOT named on joins the WHO list. it found the
// swap, it chose it, and its send is recorded. an update would find
// nothing and the send would be lost.
//
// --- WHY --- `amountOut` IS RECORDED AND NOT THROWN AWAY: the amount
// that came out is the truth of THAT send — two accounts sending the
// same queued swap get two different amounts out, because the pools
// moved between the two sends. so it belongs on the account row, next
// to the hash that says which send it was.
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use sqlx::SqlitePool;

use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_accounts_store::{
    swap_queue_accounts_list_by_swap_fun, swap_queue_accounts_set_sent_fun,
};
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_row_to_json_fun::swap_queue_row_to_json_fun;
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_status_fun::{
    SHIT_1170_SWAP_QUEUE_STATUS_FAILED, SHIT_1170_SWAP_QUEUE_STATUS_SENT,
    SHIT_1170_SWAP_QUEUE_STATUS_SUCCEEDED,
};
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_store::swap_queue_get_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_caller_fun::tx_queue_caller_fun;
use crate::backend::types::swap_queue_request::SWAP_QUEUE_SENT_REQUEST;
// ========================================
pub async fn swap_queue_sent_route(
    State(pool): State<SqlitePool>,
    headers: HeaderMap,
    Path(swap_id): Path<String>,
    Json(body): Json<SWAP_QUEUE_SENT_REQUEST>,
) -> Response {
    // --- WHO IS CALLING ------------------
    let caller_account_id = match tx_queue_caller_fun(&pool, &headers).await {
        Ok(account_id) => account_id,
        Err(failure) => {
            return shit_1170_error_fun(failure.status, &failure.code, &failure.message)
                .into_response();
        }
    };

    // --- THE HASH ------------------------
    if body.tx_hash.trim().is_empty() {
        return shit_1170_error_fun(
            StatusCode::BAD_REQUEST,
            "no_tx_hash",
            "the request carried no transaction hash",
        )
        .into_response();
    }

    // --- THE STATUS ----------------------
    // the status is `succeeded` or `failed`, or nothing at all.
    let status = match body.status.as_deref() {
        None => SHIT_1170_SWAP_QUEUE_STATUS_SENT,
        Some(status) if status == SHIT_1170_SWAP_QUEUE_STATUS_SUCCEEDED => status,
        Some(status) if status == SHIT_1170_SWAP_QUEUE_STATUS_FAILED => status,
        Some(status) => {
            return shit_1170_error_fun(
                StatusCode::BAD_REQUEST,
                "bad_status",
                &format!(
                    "{} is not a status a swap can have — it is succeeded or failed",
                    status
                ),
            )
            .into_response();
        }
    };

    // --- THE AMOUNT OUT ------------------
    // it is a raw unit amount, so it must be a whole number. a number
    // that will not parse is refused here rather than stored as a word.
    let amount_out = match body.amount_out.as_deref().map(str::trim) {
        None | Some("") => None,
        Some(raw) => {
            if !raw.chars().all(|character| character.is_ascii_digit()) {
                return shit_1170_error_fun(
                    StatusCode::BAD_REQUEST,
                    "bad_amount_out",
                    "the amount out is not a whole number of the token's smallest unit",
                )
                .into_response();
            }
            Some(raw.to_string())
        }
    };

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

    // --- THE WRITE -----------------------
    if let Err(err) = swap_queue_accounts_set_sent_fun(
        &pool,
        &swap_id,
        &caller_account_id,
        body.tx_hash.trim(),
        status,
        amount_out.as_deref(),
    )
    .await
    {
        eprintln!("[swap-queue] could not write the hash: {err}");
        return shit_1170_error_fun(
            StatusCode::INTERNAL_SERVER_ERROR,
            "db_unavailable",
            "the hash could not be written",
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

    let item = swap_queue_row_to_json_fun(&swap, &accounts);
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
