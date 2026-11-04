// ========================================
// ENDPOINT_SHIT_1170_API_KEYS
// everything that proves who a caller is and what they are allowed to
// read.
//
// it fronts three routes: `/api/shit-1170/api-keys`,
// `/api/shit-1170/api-key/me` and `/api/shit-1170/api-key/rotate`.
//
// --- WHY --- these live together: the api key, the store that keeps it
// and the NEP-413 check that hands one out are one flow. the key is
// made, it is verified against a wallet signature, it is written to the
// db and it is looked up again on the next request. splitting them
// across folders would break that flow into pieces.
//
// --- WHY --- it used to be called `endpoint_shit_1170_sessions`: the
// credential in it is not a browser session. the user signs in once and
// hands the key to an agent, and the agent holds it as a bearer token
// for as long as it lives. a "session" describes the browser's short use
// of it; an "api key" describes what it actually is.
// ========================================
pub mod api_key_account_fun;
pub mod api_key_fun;
pub mod api_key_of_header_fun;
pub mod api_keys_store;
#[cfg(test)]
pub mod api_keys_store_test;
pub mod nep413_verify_fun;
#[cfg(test)]
pub mod nep413_verify_fun_test;
// ========================================
// copyright 2026 by sleet.near
// ========================================
