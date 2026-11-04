// ========================================
// TX_QUEUE_QUERY
// the query params our /api/shit-1170/tx-queue routes accept.
//
// two sets of params live here:
// - the list filters
// - the stats limit
//
// --- WHY --- the names are snake_case on the wire: the plan spells them
// `account_id`, `hide_sent`, `contract_id`, `method`, `limit` and
// `offset`, and they are the names the api docs and the middleman use.
// so they are renamed EXPLICITLY, one by one, and not left to a blanket
// rename that would change them behind the caller's back.
//
// --- WHY --- `serde_urlencoded` does NOT convert camelCase to
// snake_case: it matches the query key literally. so `accountId` would
// never see the `account_id` the api uses, and the filter would be
// silently ignored.
use serde::Deserialize;
// ========================================
// --- LIST QUERY ------------------------
#[derive(Debug, Clone, Default, Deserialize)]
pub struct TX_QUEUE_QUERY {
    // only the queues this account is on.
    #[serde(default)]
    pub account_id: Option<String>,
    // with the account, drop the queues this account has already sent.
    // it needs the account — "has this account sent it" is a question
    // about ONE account.
    //
    // --- WHY --- it is a STRING and not a bool: the plan spells the
    // filter `hide_sent=1`, and a `bool` in serde only accepts the
    // words `true` and `false`. a `1` would fail the extraction, and
    // axum would answer a 422 that says nothing about the filter. the
    // route reads the string and turns it into the bool the store
    // wants.
    #[serde(default)]
    pub hide_sent: Option<String>,
    // only the queues holding a transaction for this contract.
    #[serde(default)]
    pub contract_id: Option<String>,
    // only the queues holding a transaction for this method.
    #[serde(default)]
    pub method: Option<String>,
    // how many to return. the default is filled in by the route, because
    // a default of 0 would answer with nothing.
    #[serde(default)]
    pub limit: Option<i64>,
    // where to start.
    #[serde(default)]
    pub offset: Option<i64>,
}

// ========================================
// --- STATS QUERY ------------------------
// how many the stats routes answer with.
#[derive(Debug, Clone, Default, Deserialize)]
pub struct TX_QUEUE_STATS_QUERY {
    // how many rows the stats answer carries.
    #[serde(default)]
    pub limit: Option<i64>,
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
