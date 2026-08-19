//! huggies_rex_route_quote_type
//!
//! Quote returned by `/api/get_return` for a single swap path.
// =========================================
use serde::{Deserialize, Serialize};

use crate::logic::types::token_amount_type::TOKEN_AMOUNT_TYPE;
// =========================================
/// One hop in a swap route. `amount_in` and `amount_out` are typed
/// amounts — the route builder knows the decimals for each side
/// (from the in-memory token map at build time) and bakes them in
/// so the UI never has to guess.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ROUTE_HOP_TYPE {
    pub pool_id: u64,
    pub token_in: String,
    pub token_out: String,
    pub amount_in: TOKEN_AMOUNT_TYPE,
    pub amount_out: TOKEN_AMOUNT_TYPE,
}
// =========================================
/// A quoted swap path from `token_in` to `token_out`. `amount_in` and
/// `amount_out` are kept as raw decimal strings for backwards compat;
/// the typed amounts on each hop carry decimals for display.
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
