//! huggies_rex_network_const
//!
//! Network, RPC, and external service URL constants.
// =========================================
pub const NEAR_CHAIN_ID: &str = "mainnet";
pub const PRICE_INDEXER_BASE_URL: &str = "https://prices.intear.tech";
pub const EVENTS_WS_BASE_URL: &str = "wss://ws-events-v3.intear.tech";
pub const HTTP_CLIENT_TIMEOUT_SECS: u64 = 30;
// =========================================
pub const NETWORK_CONST_TYPE: NETWORK_CONST_TYPE = NETWORK_CONST_TYPE {
    near_chain_id: NEAR_CHAIN_ID,
    price_indexer_base_url: PRICE_INDEXER_BASE_URL,
    events_ws_base_url: EVENTS_WS_BASE_URL,
    http_client_timeout_secs: HTTP_CLIENT_TIMEOUT_SECS,
};
// =========================================
pub struct NETWORK_CONST_TYPE {
    pub near_chain_id: &'static str,
    pub price_indexer_base_url: &'static str,
    pub events_ws_base_url: &'static str,
    pub http_client_timeout_secs: u64,
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
