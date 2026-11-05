// ========================================
// SHIT_1170_QUERY_LIST_FUN
// the list-shaped query params: one param that may be given more than
// once, and whose values may also be comma separated.
//
// --- WHY --- ONE PARAM AND NOT A REPEATED NAME: `?contract_id=a&contract_id=b`
// is the textbook shape and it is what a hand-written url does, but a
// filter bar in a browser builds its query string from a map and a map
// has one value per key — so the bar has to flatten its set into one
// string. `?contract_id=a,b` does that without a second name, and the
// api reads BOTH shapes so a hand-written url and a built one work the
// same.
//
// --- WHY --- THE VALUES ARE TRIMMED AND BLANKS ARE DROPPED: a trailing
// comma (`a,b,`) is what a join on an empty item leaves behind, and an
// empty contract id is not a contract.
//
// --- WHY --- THE LIST IS DEDUPED: the same contract picked twice is one
// contract, and a duplicate in the sql would make the `IN` list longer
// for nothing.
use std::collections::BTreeSet;
// ========================================
// --- PARSE -----------------------------
// the values of one list-shaped query param.
//
// --- WHY --- IT TAKES THE RAW PARAM AND NOT A LIST OF PARAMS: the query
// extractor reads ONE value per param, and a list param would have to
// be repeated — which a browser cannot build out of a map. so the param
// carries its values COMMA SEPARATED, and this is where they are split.
//
// --- WHY --- IT IS A `BTreeSet` AND NOT A `Vec`: the order of the
// filters does not matter, and a set keeps the values unique and in a
// stable order, so the same filter always produces the same sql and the
// query plan is the same one every time.
//
// --- WHY --- A MISSING PARAM IS AN EMPTY LIST AND NOT AN ERROR: the
// filter is optional, and a filter that was not given is a filter that
// is off.
pub fn shit_1170_query_list_fun(raw: Option<&str>) -> Vec<String> {
    let raw = match raw {
        Some(raw) => raw,
        None => return Vec::new(),
    };
    let mut set: BTreeSet<String> = BTreeSet::new();
    for part in raw.split(',') {
        let trimmed = part.trim();
        if trimmed.is_empty() {
            continue;
        }
        set.insert(trimmed.to_string());
    }
    set.into_iter().collect()
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
