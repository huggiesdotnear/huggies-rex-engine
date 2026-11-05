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
//
// --- WHY --- `account_id` and `contract_id` are COMMA SEPARATED: the
// feed's filter bar lets a reader pick several accounts and several
// contracts, and "the batches of alice OR bob" is a question one id
// cannot answer. one param carries many values, because the query
// extractor reads one value per param and a browser cannot build a
// repeated param out of a map.
use serde::Deserialize;
// ========================================
// --- LIST QUERY ------------------------
#[derive(Debug, Clone, Default, Deserialize)]
pub struct TX_QUEUE_QUERY {
    // only the queues these accounts are on.
    //
    // --- WHY --- IT IS A COMMA SEPARATED STRING AND NOT A LIST: the
    // query extractor reads ONE value per param, and a list field would
    // need the param to be repeated — which a browser cannot build out
    // of a map. one comma separated string carries many values, and it
    // reads the same in a hand-written url.
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
    // only the queues holding a transaction for one of these contracts.
    //
    // --- WHY --- IT IS A COMMA SEPARATED STRING AND NOT A LIST: the
    // same reason the account filter is.
    #[serde(default)]
    pub contract_id: Option<String>,
    // only the queues holding a transaction for this method.
    #[serde(default)]
    pub method: Option<String>,
    // how many to return. the default is filled in by the route, because
    // a default of 0 would answer with nothing.
    #[serde(default)]
    pub limit: Option<i64>,
    // where the page starts.
    //
    // --- WHY --- IT IS A CURSOR AND NOT AN OFFSET: new batches land at
    // the top of the list all the time, so "skip the first N rows"
    // would show the reader the same batch twice or skip one. the
    // cursor says "the rows after THIS one", and that stays true
    // whatever lands above it.
    #[serde(default)]
    pub cursor: Option<String>,
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
