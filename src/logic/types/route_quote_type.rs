//! huggies_rex_route_quote_type
//!
//! Quote returned by `get_return` for a single swap path.
// =========================================
use serde::{Deserialize, Serialize};
// =========================================
/// One hop in a swap route.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ROUTE_HOP_TYPE {
    pub pool_id: u64,
    pub token_in: String,
    pub token_out: String,
    pub amount_in: String,
    pub amount_out: String,
}
// =========================================
/// A quoted swap path from `token_in` to `token_out`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ROUTE_QUOTE_TYPE {
    pub token_in: String,
    pub token_out: String,
    pub amount_in: String,
    pub amount_out: String,
    pub hops: Vec<ROUTE_HOP_TYPE>,
    pub source: ROUTE_SOURCE_TYPE,
}
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ROUTE_SOURCE_TYPE {
    Local,
    Rpc,
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
