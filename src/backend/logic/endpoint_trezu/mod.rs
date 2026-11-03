// ========================================
// ENDPOINT_TREZU
// everything that talks to the trezu api.
//
// it fronts one route: `/api/trezu/user/treasuries`.
//
// --- WHY --- these live together: the base url, the http client, the
// path, the query params and the error shape are the whole surface of
// one upstream. the proxy route composes them, and a change to the
// upstream is a change to every one of them.
// ========================================
pub mod trezu_account_id_fun;
pub mod trezu_base_url_fun;
pub mod trezu_client_fun;
pub mod trezu_error_fun;
pub mod trezu_include_hidden_fun;
pub mod trezu_treasuries_path_fun;
// ========================================
// copyright 2026 by sleet.near
// ========================================
