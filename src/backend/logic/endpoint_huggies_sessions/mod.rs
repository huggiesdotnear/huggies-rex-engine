// ========================================
// ENDPOINT_HUGGIES_SESSIONS
// everything that proves who a caller is and what they are allowed to
// read.
//
// it fronts three routes: `/api/huggies/sessions`,
// `/api/huggies/session/me` and `/api/huggies/session/rotate`.
//
// --- WHY --- these live together: the session key, the store that keeps
// it and the NEP-413 check that hands one out are one flow. the key is
// made, it is verified against a wallet signature, it is written to the
// db and it is looked up again on the next request. splitting them
// across folders would break that flow into pieces.
// ========================================
pub mod nep413_verify_fun;
#[cfg(test)]
pub mod nep413_verify_fun_test;
pub mod session_key_fun;
pub mod sessions_store;
#[cfg(test)]
pub mod sessions_store_test;
// ========================================
// copyright 2026 by sleet.near
// ========================================
