//! huggies_rex_trader_view_type
//!
//! Aggregated trader profile data returned by the trader page and
//! `/api/trader/{account_id}` endpoint.
// =========================================
use serde::{Deserialize, Serialize};
// =========================================
/// One non-zero LP deposit for a trader. rhea's `get_deposits` keys
/// the response by token contract id (sum across all pools that
/// contain that token), so the `pool_id` is best-effort: when the
/// trader has a single LP position for the token we attach the
/// concrete pool id, otherwise we leave it as 0.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TRADER_DEPOSIT_TYPE {
    pub token_id: String,
    pub shares: String,
    pub pool_id: u64,
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
