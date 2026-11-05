// ========================================
// SWAP_QUEUE_QUERY
// the query parameters of the swap queue list.
//
// --- WHY --- the names are snake_case: they are query parameters, and
// the tx queue's query parameters are snake_case too. one page's
// parameters should read the same as another's.
//
// --- WHY --- `contract_id` IS NAMED THE SAME AS THE TX QUEUE'S: the
// feed's filter bar picks contracts, and the bar does not know which
// list it is filtering — so the same picked contract has to reach both
// lists under the same name, or the bar would have to speak two
// languages.
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
    //
    // --- WHY --- IT STAYS A SINGLE VALUE AND IS NOT THE CONTRACT LIST:
    // `token_in` says "the swap sells THIS token" and `token_out` says
    // "the swap buys THIS token". the contract list below says "the
    // swap touches one of these contracts", and that is a different
    // question. the two filters live side by side so a caller that
    // wants one of them can still use the other.
    pub token_in: Option<String>,
    // only the swaps that buy this token.
    pub token_out: Option<String>,
    // only the swaps that touch one of these contracts.
    //
    // --- WHY --- IT IS A COMMA SEPARATED STRING AND NOT A LIST: the
    // query extractor reads ONE value per param, and a list field would
    // need the param to be repeated — which a browser cannot build out
    // of a map. one comma separated string carries many values, and it
    // reads the same in a hand-written url.
    #[serde(default)]
    pub contract_id: Option<String>,
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
