// ========================================
// SWAP_QUEUE_REQUEST
// the bodies our /api/shit-1170/swap-queue routes accept.
//
// three bodies live here:
// - the swap body — the token in, the amount in and the token out
// - the accounts body — one account id
// - the sent body — the hash of the swap that went out, and the outcome
//
// --- WHY --- the field names are camelCase on the wire: the browser's
// session object already uses camelCase (`accountId`), so the same names
// are kept all the way through and nothing is renamed on the way.
//
// --- WHY --- `amountIn` is the RAW unit amount and not a human amount:
// the chain and the router trade the token's smallest unit, and a human
// amount is only meaningful next to the token it belongs to — "1.5 NEAR"
// and "1.5 USDC" are different trades. the raw number means the same
// thing whatever the token's decimals are.
//
// --- WHY --- `amountOut` and `dexId` are OPTIONAL on the swap body: the
// agent may queue a swap without a quote. the quote is worked out live
// on the feed page, and the stored one is only the fallback.
//
// --- WHY --- everything on the swap body is optional except the swap
// itself: an agent that knows the WHAT and not the WHY must still be
// able to queue. a made-up WHY is worse than no WHY.
use serde::{Deserialize, Serialize};
// ========================================
// --- REQUEST ----------------------------
// the queue body: a swap and the WHO it is for.
//
// --- WHY --- it DEFAULTS to empty strings and not to missing fields: a
// missing field would fail the json extraction, and axum answers that
// with a 422 that says nothing about which field was wrong. an empty
// string reaches the route, and the route answers a 400 that names it.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SWAP_QUEUE_REQUEST {
    // what the swap does, in words. it may be nothing.
    #[serde(default)]
    pub what: Option<String>,
    // when it should happen, in words. it may be nothing.
    #[serde(default)]
    pub when: Option<String>,
    // why the user wants it. it may be nothing.
    #[serde(default)]
    pub why: Option<String>,
    // the machine-readable version of `when`, epoch ms. it may be
    // nothing.
    #[serde(default)]
    pub when_at: Option<i64>,
    // the token being sold. it is required.
    #[serde(default)]
    pub token_in: String,
    // the raw amount of the token in that is sold, in the token's
    // smallest unit. it is required.
    #[serde(default)]
    pub amount_in: String,
    // the token being bought. it is required.
    #[serde(default)]
    pub token_out: String,
    // the quoted amount out, in the output token's smallest unit. it may
    // be nothing.
    #[serde(default)]
    pub amount_out: Option<String>,
    // the dex the quote came from. it may be nothing.
    #[serde(default)]
    pub dex_id: Option<String>,
    // the WHO — the accounts the agent is queuing this for. it is
    // optional, and every account in it must be one the agent holds an
    // api key for. that is the NAMING RULE.
    #[serde(default)]
    pub accounts: Option<Vec<String>>,
}

// the body of the add-an-account route.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SWAP_QUEUE_ACCOUNT_REQUEST {
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

// the body of the sent route.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SWAP_QUEUE_SENT_REQUEST {
    // the hash of the transaction that went out. it is required — a
    // hash without a transaction says nothing.
    //
    // --- WHY --- it DEFAULTS to an empty string and not to a missing
    // field: a missing field fails the json extraction, and axum answers
    // that with a 422. an empty string reaches the route, and the route
    // answers a 400 that says what was wrong.
    #[serde(default)]
    pub tx_hash: String,
    // the outcome. it may be left out, and then the status is `sent` —
    // it went out and nobody knows how it went yet.
    #[serde(default)]
    pub status: Option<String>,
    // the amount that came out, in the output token's smallest unit. it
    // may be left out, and then it is simply not known.
    #[serde(default)]
    pub amount_out: Option<String>,
}
// ========================================
// --- RESPONSE --------------------------
// one account on one queued swap — the WHO object.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SWAP_QUEUE_ACCOUNT {
    // the account.
    pub account_id: String,
    // where the account is with this swap: pending, sent, succeeded or
    // failed.
    pub status: String,
    // the hash of the transaction the account sent. it is null until
    // somebody sends.
    pub tx_hash: Option<String>,
    // the amount that came out, in the output token's smallest unit. it
    // is null until somebody sends.
    pub amount_out: Option<String>,
}

// one queued swap.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SWAP_QUEUE_ITEM {
    // the swap's id.
    pub swap_id: String,
    // what the swap does, in words. it may be nothing.
    pub what: Option<String>,
    // when it should happen, in words. it may be nothing.
    pub when: Option<String>,
    // why the user wants it. it may be nothing.
    pub why: Option<String>,
    // the machine-readable `when`, epoch ms. it may be nothing.
    pub when_at: Option<i64>,
    // the token being sold.
    pub token_in: String,
    // the raw amount of the token in that is sold.
    pub amount_in: String,
    // the token being bought.
    pub token_out: String,
    // the quoted amount out, in the output token's smallest unit. it may
    // be nothing.
    pub amount_out: Option<String>,
    // the dex the quote came from. it may be nothing.
    pub dex_id: Option<String>,
    // the WHO — the accounts this swap is for.
    pub accounts: Vec<SWAP_QUEUE_ACCOUNT>,
    // when the swap was queued, in ms since the epoch.
    pub created_at: i64,
    // when the swap was last touched, in ms since the epoch.
    pub updated_at: i64,
}

// the answer of the list route.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SWAP_QUEUE_LIST_RESPONSE {
    // the swaps on this page.
    pub items: Vec<SWAP_QUEUE_ITEM>,
    // how many swaps matched, BEFORE the limit and the cursor took
    // their cut. it is how many pages there are.
    pub total: i64,
    // the cursor of the NEXT page, or null when this page is the last
    // one.
    //
    // --- WHY --- IT IS A TOKEN AND NOT A NUMBER: the caller hands it
    // straight back, and it says "the rows after this one" — not "the
    // rows after this many". a new swap landing at the top of the list
    // does not move the reader's place in it.
    pub next_cursor: Option<String>,
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
