//! huggies_rex_events_const
//!
//! WebSocket event stream endpoint paths and reconnect / ping intervals.
// =========================================
pub const TRADE_POOL_EVENT_PATH: &str = "/events/trade_pool";
pub const TRADE_POOL_CHANGE_EVENT_PATH: &str = "/events/trade_pool_change";
pub const TRADE_SWAP_EVENT_PATH: &str = "/events/trade_swap";
pub const WS_RECONNECT_DELAY_SECS: u64 = 5;
pub const WS_PING_INTERVAL_SECS: u64 = 30;
// =========================================
pub const EVENTS_CONST_TYPE: EVENTS_CONST_TYPE = EVENTS_CONST_TYPE {
    trade_pool_event_path: TRADE_POOL_EVENT_PATH,
    trade_pool_change_event_path: TRADE_POOL_CHANGE_EVENT_PATH,
    trade_swap_event_path: TRADE_SWAP_EVENT_PATH,
    ws_reconnect_delay_secs: WS_RECONNECT_DELAY_SECS,
    ws_ping_interval_secs: WS_PING_INTERVAL_SECS,
};
// =========================================
pub struct EVENTS_CONST_TYPE {
    pub trade_pool_event_path: &'static str,
    pub trade_pool_change_event_path: &'static str,
    pub trade_swap_event_path: &'static str,
    pub ws_reconnect_delay_secs: u64,
    pub ws_ping_interval_secs: u64,
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
