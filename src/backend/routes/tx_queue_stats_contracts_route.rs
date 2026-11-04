// ========================================
// TX_QUEUE_STATS_CONTRACTS_ROUTE
// GET /api/shit-1170/tx-queue/stats/contracts — how many queued
// transactions hit each contract.
//
// the answer:
//   { "items": [ { "contractId": "ref.finance.near", "count": 12 } ] }
//
// ordered by count, biggest first. a `limit` query param, default 20.
//
// 401 = the x-api-key header is missing, or the key is not one of ours.
// 500 = the db could not be reached.
//
// --- WHY --- this is a `GROUP BY` over the transactions and not over the
// account rows: a queued tx exists the moment it is queued. nobody has
// to have sent it for it to be a queued tx.
//
// --- WHY --- the `contract_id` has its own COLUMN and not a place inside
// a json blob: this query is the whole reason it is a column. a group by
// on an indexed column is a cheap read, and a group by inside a json
// blob is a scan of every row, every time.
use axum::{
    Json,
    extract::{Query, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use sqlx::SqlitePool;

use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_caller_fun::tx_queue_caller_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_stats_store::tx_queue_stats_contracts_fun;
use crate::backend::types::tx_queue_query::TX_QUEUE_STATS_QUERY;
use crate::backend::types::tx_queue_request::{
    TX_QUEUE_CONTRACT_STAT, TX_QUEUE_CONTRACT_STATS_RESPONSE,
};
// ========================================
// --- CONFIG -----------------------------
// how many contracts the answer carries when no limit is given.
const SHIT_1170_TX_QUEUE_STATS_LIMIT: i64 = 20;

// the most rows the answer may hold, whatever the caller asked for.
//
// --- WHY --- a limit is CLAMPED and not refused: a caller who asks for
// a thousand is not a caller to be turned away. and a NEGATIVE limit
// means "no limit" in sqlite, so it has to be clamped too.
const SHIT_1170_TX_QUEUE_STATS_MAX_LIMIT: i64 = 500;
// ========================================
pub async fn tx_queue_stats_contracts_route(
    State(pool): State<SqlitePool>,
    headers: HeaderMap,
    Query(query): Query<TX_QUEUE_STATS_QUERY>,
) -> Response {
    // the key is the gate, even for a read that says nothing private.
    // --- WHY --- THE KEY IS NOT ASKED FOR: the stats are READ-ONLY and
    // they are about the queue as a whole — how many batches name this
    // contract, how many call this method. there is no account in the
    // answer and nothing the reader can act on, so there is nothing to
    // gate.
    let _caller_account_id = match tx_queue_caller_fun(&pool, &headers).await {
        Ok(account_id) => Some(account_id),
        Err(failure) if failure.status == StatusCode::UNAUTHORIZED => None,
        Err(failure) => {
            return shit_1170_error_fun(failure.status, &failure.code, &failure.message)
                .into_response();
        }
    };

    let limit = match query.limit {
        None => SHIT_1170_TX_QUEUE_STATS_LIMIT,
        Some(limit) if limit < 1 => SHIT_1170_TX_QUEUE_STATS_LIMIT,
        Some(limit) => limit.min(SHIT_1170_TX_QUEUE_STATS_MAX_LIMIT),
    };

    let rows = match tx_queue_stats_contracts_fun(&pool, limit).await {
        Ok(rows) => rows,
        Err(err) => {
            eprintln!("[tx-queue] could not read the contract stats: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the contract stats could not be read",
            )
            .into_response();
        }
    };

    let items: Vec<TX_QUEUE_CONTRACT_STAT> = rows
        .into_iter()
        .map(|row| TX_QUEUE_CONTRACT_STAT {
            contract_id: row.contract_id,
            count: row.count,
        })
        .collect();

    (
        StatusCode::OK,
        Json(TX_QUEUE_CONTRACT_STATS_RESPONSE { items }),
    )
        .into_response()
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
