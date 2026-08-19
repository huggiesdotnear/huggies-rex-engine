//! huggies_rex_trader_view_type
//!
//! Aggregated trader profile data returned by the trader page and
//! `/api/trader/{account_id}` endpoint.
// =========================================
use serde::{Deserialize, Serialize};

use crate::logic::types::token_amount_type::TOKEN_AMOUNT_TYPE;
// =========================================
/// One non-zero token balance a trader holds inside the rhea DEX.
/// `get_deposits` returns a map keyed by NEP-141 token contract id
/// whose value is the user's internal rhea balance for that token
/// (pre-funded for trading — withdrawable at any time, unrelated to
/// any pool or LP position). The balance is wrapped in a
/// [`TOKEN_AMOUNT_TYPE`] carrying the underlying token's decimals +
/// symbol from the in-memory token map so the UI can render both
/// raw and human-readable figures.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TRADER_DEPOSIT_TYPE {
    pub token_id: String,
    pub balance: TOKEN_AMOUNT_TYPE,
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
