// ========================================
// TX_QUEUE_FACETS_ROUTE
// GET /api/shit-1170/tx-queue/facets — the CONTRACTS and the ACCOUNTS
// the feed's filter bar offers.
//
// --- WHY --- THIS EXISTS: the filter bar has a button for each contract
// and each account that has queued work, and it cannot show a button for
// something that is not there. the bar asks this route once when the
// page opens and builds its buttons from the answer.
//
// --- WHY --- THE ROUTE IS OPEN: the queue list is open, and the facets
// are a summary of the same thing. a reader who can read the feed can
// read what is in it.
//
// --- WHY --- THERE IS A LIMIT AND NOT A COUNT OF EVERYTHING: a db with
// ten thousand queued accounts would make a bar of ten thousand buttons,
// and a reader cannot use that. the limit keeps the bar readable, and the
// bar says that there are more.
//
// 200 = the contracts and the accounts.
// 500 = the db could not be reached.
use axum::{
    Json,
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_facets_store::{
    tx_queue_facet_accounts_fun, tx_queue_facet_contracts_fun,
};
use crate::backend::logic::feed_ws::app_state::APP_STATE;
use crate::backend::types::tx_queue_facets_request::{
    TX_QUEUE_FACETS_QUERY, TX_QUEUE_FACETS_RESPONSE,
};
// ========================================
// --- CONFIG -----------------------------
// how many contracts and accounts the answer carries when no limit is
// given.
//
// --- WHY --- forty: the bar is a wall of buttons, and a reader has to
// be able to scan it. the busy ones come first, and the rest are one
// click away on the search.
const SHIT_1170_TX_QUEUE_FACETS_LIMIT: i64 = 40;

// the most the answer may carry, whatever the caller asked for.
//
// --- WHY --- a limit is CLAMPED and not refused: the same rule the queue
// list follows.
const SHIT_1170_TX_QUEUE_FACETS_MAX_LIMIT: i64 = 500;
// ========================================
// --- GET --------------------------------
// the contracts and the accounts the filter bar offers.
pub async fn tx_queue_facets_route(
    State(state): State<APP_STATE>,
    Query(query): Query<TX_QUEUE_FACETS_QUERY>,
) -> Response {
    // --- WHY --- THE POOL IS TAKEN OUT OF THE STATE: the router's
    // state holds the pool and the feed bus, and this route needs
    // the pool. the bus is not needed here.
    let pool = state.pool.clone();
    let limit = limit_fun(
        query.limit,
        SHIT_1170_TX_QUEUE_FACETS_LIMIT,
        SHIT_1170_TX_QUEUE_FACETS_MAX_LIMIT,
    );

    // --- THE CONTRACTS --------------------
    let contracts = match tx_queue_facet_contracts_fun(&pool, limit).await {
        Ok(found) => found,
        Err(err) => {
            eprintln!("[tx-queue-facets] could not read the contracts: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the contracts could not be read",
            )
            .into_response();
        }
    };

    // --- THE ACCOUNTS --------------------
    let accounts = match tx_queue_facet_accounts_fun(&pool, limit).await {
        Ok(found) => found,
        Err(err) => {
            eprintln!("[tx-queue-facets] could not read the accounts: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the accounts could not be read",
            )
            .into_response();
        }
    };

    (
        StatusCode::OK,
        Json(TX_QUEUE_FACETS_RESPONSE {
            contracts: contracts
                .into_iter()
                .map(|one| crate::backend::types::tx_queue_facets_request::TX_QUEUE_FACET_CONTRACT {
                    contract_id: one.contract_id,
                    count: one.count,
                })
                .collect(),
            accounts: accounts
                .into_iter()
                .map(|one| crate::backend::types::tx_queue_facets_request::TX_QUEUE_FACET_ACCOUNT {
                    account_id: one.account_id,
                    count: one.count,
                })
                .collect(),
        }),
    )
        .into_response()
}
// ========================================
// --- HELPERS ----------------------------
// the page size, clamped.
//
// --- WHY --- a limit is CLAMPED and not refused: a caller who asks for
// a thousand is not a caller to be turned away, and a NEGATIVE limit
// means "no limit" in sqlite, so it has to be clamped too.
fn limit_fun(asked: Option<i64>, default: i64, max: i64) -> i64 {
    match asked {
        None => default,
        Some(limit) if limit < 1 => default,
        Some(limit) => limit.min(max),
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
