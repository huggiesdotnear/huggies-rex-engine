// ========================================
// TX_QUEUE_FACETS_REQUEST
// the body of the facets route — the query it takes and the answer it
// gives.
//
// --- WHY --- the names are camelCase on the wire: the browser's session
// object already uses camelCase (`accountId`), so the same names are
// kept all the way through and nothing is renamed on the way.
use serde::{Deserialize, Serialize};
// ========================================
// --- QUERY -----------------------------
// how many the facets answer carries.
#[derive(Debug, Clone, Default, Deserialize)]
pub struct TX_QUEUE_FACETS_QUERY {
    // how many contracts and how many accounts.
    //
    // --- WHY --- it is a NUMBER and not a string: there is one limit and
    // it applies to both lists, and there is no second word to read.
    #[serde(default)]
    pub limit: Option<i64>,
}
// ========================================
// --- RESPONSE --------------------------
// one contract in the facet list.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_FACET_CONTRACT {
    // the contract.
    pub contract_id: String,
    // how many queued transactions call it.
    pub count: i64,
}

// one account in the facet list.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_FACET_ACCOUNT {
    // the account.
    pub account_id: String,
    // how many queued batches it is on.
    pub count: i64,
}

// the answer of the facets route.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_FACETS_RESPONSE {
    // the contracts that have queued transactions.
    pub contracts: Vec<TX_QUEUE_FACET_CONTRACT>,
    // the accounts that have queued transactions.
    pub accounts: Vec<TX_QUEUE_FACET_ACCOUNT>,
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
