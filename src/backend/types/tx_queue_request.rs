// ========================================
// TX_QUEUE_REQUEST
// the bodies our /api/shit-1170/tx-queue routes accept.
//
// three bodies live here:
// - the queue body — a batch of transactions and the accounts it is for
// - the accounts body — one account id
// - the sent body — the hashes of the transactions that went out
//
// --- WHY --- the field names are camelCase on the wire: the browser's
// session object already uses camelCase (`accountId`), so the same names
// are kept all the way through and nothing is renamed on the way.
//
// --- WHY --- `args` is a JSON OBJECT on the wire and not a string: the
// near-kit toolbox takes a json object of arguments, and the frontend
// hands the transactions straight to `generic_contract_call_wallet`. a
// string would make the frontend parse it and then re-serialize it.
//
// --- WHY --- the `when` field is `when` and not `when_text`: `when` is a
// reserved word in RUST, so the db row calls it `when_text`, but the
// wire name is the plain word the plan uses.
//
// --- WHY --- everything on the queue body is optional except the
// transactions: an agent that knows the WHAT and not the WHY must still
// be able to queue. a made-up WHY is worse than no WHY.
use serde::{Deserialize, Serialize};
use serde_json::Value;
// ========================================
// --- REQUEST ----------------------------
// one function call in the batch.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_TRANSACTION_REQUEST {
    // the contract being called. it is required — a call without a
    // contract is not a call.
    //
    // --- WHY --- it DEFAULTS to an empty string and not to a missing
    // field: a missing field would fail the json extraction, and axum
    // answers that with a 422 that says nothing about which call was
    // wrong. an empty string reaches the route, and the route answers a
    // 400 that names the position of the offending call.
    #[serde(default)]
    pub contract_id: String,
    // the method name. it is required.
    #[serde(default)]
    pub method: String,
    // the arguments, as a json object. it may be left out, and then it is
    // an empty object — a call with no arguments is a normal thing.
    #[serde(default)]
    pub args: Option<Value>,
    // the gas, as a string. it may be nothing.
    #[serde(default)]
    pub gas: Option<String>,
    // the deposit, as a string. it may be nothing.
    #[serde(default)]
    pub deposit: Option<String>,
}

// the queue body: a batch of transactions and the WHO it is for.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_REQUEST {
    // what the transactions do, in words. it may be nothing.
    #[serde(default)]
    pub what: Option<String>,
    // when they should happen, in words. it may be nothing.
    #[serde(default)]
    pub when: Option<String>,
    // why the user wants them. it may be nothing.
    #[serde(default)]
    pub why: Option<String>,
    // the machine-readable version of `when`, epoch ms. it may be
    // nothing.
    #[serde(default)]
    pub when_at: Option<i64>,
    // the batch. it must hold between one and fifty transactions.
    //
    // --- WHY --- it DEFAULTS to an empty list and not to a missing
    // field: a missing field fails the json extraction, and axum answers
    // that with a 422. an empty list reaches the route, and the route
    // answers a 400 that says what was wrong.
    #[serde(default)]
    pub transactions: Vec<TX_QUEUE_TRANSACTION_REQUEST>,
    // the WHO — the accounts the agent is queuing this for. it is
    // optional, and every account in it must be one the agent holds an
    // api key for. that is the NAMING RULE.
    #[serde(default)]
    pub accounts: Option<Vec<String>>,
}

// the body of the add-an-account route.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_ACCOUNT_REQUEST {
    // the account being added. it must be the account the api key
    // belongs to.
    //
    // --- WHY --- it DEFAULTS to an empty string and not to a missing
    // field: a missing field fails the json extraction, and axum answers
    // that with a 422. an empty string reaches the route, and the route
    // answers a 403 that says the account is not yours.
    #[serde(default)]
    pub account_id: String,
}

// one hash of one transaction that went out.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_HASH_REQUEST {
    // which transaction of the batch the hash belongs to. it is
    // required — a hash without a transaction says nothing.
    //
    // --- WHY --- it DEFAULTS to an empty string and not to a missing
    // field: a missing field fails the json extraction, and axum answers
    // that with a 422. an empty string reaches the route, and the route
    // answers a 400 that names the entry.
    #[serde(default)]
    pub tx_id: String,
    // the hash. it is required.
    //
    // --- WHY --- it DEFAULTS to an empty string for the same reason:
    // the route is where the "no hash" rule lives, and it answers a 400.
    #[serde(default)]
    pub tx_hash: String,
    // the outcome. it may be left out, and then the status is `sent` —
    // it went out and nobody knows how it went yet.
    #[serde(default)]
    pub status: Option<String>,
}

// the body of the sent route.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_SENT_REQUEST {
    // the hashes of the whole batch. one call, one wallet popup.
    //
    // --- WHY --- it DEFAULTS to an empty list and not to a missing
    // field: a missing field fails the json extraction, and axum answers
    // that with a 422. an empty list reaches the route, and the route
    // answers a 400 that says what was wrong.
    #[serde(default)]
    pub tx_hashes: Vec<TX_QUEUE_HASH_REQUEST>,
}
// ========================================
// --- RESPONSE --------------------------
// one account on one transaction — the WHO object.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_ACCOUNT {
    // the account.
    pub account_id: String,
    // where the account is with this transaction: pending, sent,
    // succeeded or failed.
    pub status: String,
    // the hash of the transaction the account sent. it is null until
    // somebody sends.
    pub tx_hash: Option<String>,
}

// one function call in the batch.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_TRANSACTION {
    // the transaction's id.
    pub tx_id: String,
    // the order of this transaction inside the batch, from zero.
    pub position: i64,
    // the contract being called.
    pub contract_id: String,
    // the method name.
    pub method: String,
    // the arguments, as a json object.
    pub args: Value,
    // the gas, as a string. it may be nothing.
    pub gas: Option<String>,
    // the deposit, as a string. it may be nothing.
    pub deposit: Option<String>,
    // the accounts on THIS transaction.
    pub accounts: Vec<TX_QUEUE_ACCOUNT>,
}

// the whole batch.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_ITEM {
    // the batch's id.
    pub queue_id: String,
    // what the transactions do, in words. it may be nothing.
    pub what: Option<String>,
    // when they should happen, in words. it may be nothing.
    pub when: Option<String>,
    // why the user wants them. it may be nothing.
    pub why: Option<String>,
    // the machine-readable `when`, epoch ms. it may be nothing.
    pub when_at: Option<i64>,
    // the calls of the batch, in `position` order.
    pub transactions: Vec<TX_QUEUE_TRANSACTION>,
    // the WHO across the whole batch — the union of the transactions'
    // account rows.
    pub accounts: Vec<TX_QUEUE_ACCOUNT>,
    // when the batch was queued, in ms since the epoch.
    pub created_at: i64,
    // when the batch was last touched, in ms since the epoch.
    pub updated_at: i64,
}

// the answer of the list route.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_LIST_RESPONSE {
    // the batches on this page.
    pub items: Vec<TX_QUEUE_ITEM>,
    // how many batches matched, BEFORE the limit and the offset took
    // their cut. it is how many pages there are.
    pub total: i64,
}

// one contract in the contract stats.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_CONTRACT_STAT {
    // the contract.
    pub contract_id: String,
    // how many queued transactions hit it.
    pub count: i64,
}

// the answer of the contract stats route.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_CONTRACT_STATS_RESPONSE {
    pub items: Vec<TX_QUEUE_CONTRACT_STAT>,
}

// one method in the method stats.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_METHOD_STAT {
    // the method.
    pub method: String,
    // the contract it was called on. it rides along because `ft_swap` on
    // two contracts is two different transactions, and a method count
    // without the contract would blend them into a misleading number.
    pub contract_id: String,
    // how many queued transactions called it.
    pub count: i64,
}

// the answer of the method stats route.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TX_QUEUE_METHOD_STATS_RESPONSE {
    pub items: Vec<TX_QUEUE_METHOD_STAT>,
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
