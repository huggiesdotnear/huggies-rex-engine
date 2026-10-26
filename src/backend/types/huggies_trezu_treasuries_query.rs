// HUGGIES_TREZU_TREASURIES_QUERY
// the query params our /api/trezu/user/treasuries route accepts. the
// upstream trezu api takes the same two names, so the proxy can
// forward them without renaming.
//
// --- WHY --- the renames are explicit: serde_urlencoded matches the
// query key literally, it does NOT convert camelCase to snake_case,
// so `account_id` would never see the `accountId` the browser sends.
// ====================================
use serde::Deserialize;
// ====================================
#[derive(Debug, Clone, Deserialize)]
pub struct huggies_trezu_treasuries_query {
    #[serde(rename = "accountId")]
    pub account_id: Option<String>,
    #[serde(rename = "includeHidden")]
    pub include_hidden: Option<String>,
}
// ====================================
// copyright 2026 by sleet.near
