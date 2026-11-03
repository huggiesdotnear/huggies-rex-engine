// TREZU_BASE_URL_FUN
// the trezu api host our backend proxies. fixed on purpose: the proxy
// only ever talks to the live trezu api, so there is nothing to
// configure per call.
// ====================================
pub fn trezu_base_url_fun() -> &'static str {
    "https://api.trezu.app"
}
// ====================================
// copyright 2026 by sleet.near
