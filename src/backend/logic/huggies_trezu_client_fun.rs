// HUGGIES_TREZU_CLIENT_FUN
// build the reqwest client used to call the trezu api.
//
// the timeout is short (3s) on purpose: this client sits in front of
// a browser request, and a hung upstream call would hold the page
// hostage far longer than the trezu api ever needs to answer.
// ====================================
use std::time::Duration;
// ====================================
pub fn huggies_trezu_client_fun() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(3))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new())
}
// ====================================
// copyright 2026 by sleet.near
