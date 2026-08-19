//! huggies_rex_trader_view_type
//!
//! Aggregated trader profile data returned by the trader page and
//! `/api/trader/{account_id}` endpoint.
// =========================================
use serde::{Deserialize, Serialize};
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TRADER_DEPOSIT_TYPE {
    pub pool_id: u64,
    pub token_id: String,
    pub shares: String,
}
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TRADER_VIEW_TYPE {
    pub account_id: String,
    pub near_balance_yocto: String,
    pub deposits: Vec<TRADER_DEPOSIT_TYPE>,
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
