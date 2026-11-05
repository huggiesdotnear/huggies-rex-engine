// ========================================
// SWAP_QUEUE_QUERY
// the query parameters of the swap queue list.
//
// --- WHY --- the names are snake_case: they are query parameters, and
// the tx queue's query parameters are snake_case too. one page's
// parameters should read the same as another's.
use serde::Deserialize;
// ========================================
// --- QUERY -----------------------------
// the filters of the swap list.
//
// --- WHY --- every filter is OPTIONAL: the list is a feed, and a feed
// with no filters is the whole thing.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct SWAP_QUEUE_QUERY {
    // only the swaps these accounts are on.
    //
    // --- WHY --- IT IS A COMMA SEPARATED STRING AND NOT A LIST: the
    // query extractor reads ONE value per param, and a list field would
    // need the param to be repeated — which a browser cannot build out
    // of a map. one comma separated string carries many values, and it
    // reads the same in a hand-written url.
    #[serde(default)]
    pub account_id: Option<String>,
    // with the account, drop the swaps this account has already sent.
    //
    // --- WHY --- it is a STRING and not a bool: the query builder drops
    // undefined, null and "" but keeps false and 0, so a bool would put
    // `hide_sent=false` on the url for every reader. a string reads the
    // same words the tx queue's flag reads.
    pub hide_sent: Option<String>,
    // only the swaps that sell this token.
    pub token_in: Option<String>,
    // only the swaps that buy this token.
    pub token_out: Option<String>,
    // how many to return.
    pub limit: Option<i64>,
    // where the page starts.
    //
    // --- WHY --- IT IS A CURSOR AND NOT AN OFFSET: new swaps land at
    // the top of the list all the time, so "skip the first N rows"
    // would show the reader the same swap twice or skip one. the cursor
    // says "the rows after THIS one", and that stays true whatever
    // lands above it.
    pub cursor: Option<String>,
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
