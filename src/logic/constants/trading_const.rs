//! huggies_rex_trading_const
//!
//! Trading-engine limits and well-known token ids.
// =========================================
pub const POOL_PAGE_LIMIT: u64 = 500;
pub const MAX_ROUTE_HOPS: usize = 3;
pub const NEAR_TOKEN_ACCOUNT_ID: &str = "wrap.near";
pub const DEFAULT_TRADER_ACCOUNT_ID: &str = "frozen_bot2.user.intear.near";
// =========================================
pub const TRADING_CONST_TYPE: TRADING_CONST_TYPE = TRADING_CONST_TYPE {
    pool_page_limit: POOL_PAGE_LIMIT,
    max_route_hops: MAX_ROUTE_HOPS,
    near_token_account_id: NEAR_TOKEN_ACCOUNT_ID,
    default_trader_account_id: DEFAULT_TRADER_ACCOUNT_ID,
};
// =========================================
pub struct TRADING_CONST_TYPE {
    pub pool_page_limit: u64,
    pub max_route_hops: usize,
    pub near_token_account_id: &'static str,
    pub default_trader_account_id: &'static str,
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
