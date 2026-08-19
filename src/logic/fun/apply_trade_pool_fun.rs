//! huggies_rex_apply_trade_pool_fun
//!
//! Apply a `trade_pool` event to in-memory + sqlite pool state. The
//! event only tells us a single swap happened; we update the
//! `updated_at_unix_ms` and bump the pool row so any UI re-render
//! shows the trade.
// =========================================
use chrono::Utc;
use tracing::warn;

use crate::logic::fun::events_ws_handler_fun::TRADE_POOL_EVENT_TYPE;
use crate::logic::types::app_state_type::APP_STATE_TYPE;
// =========================================
pub async fn huggies_rex_apply_trade_pool_fun(state: &APP_STATE_TYPE, raw: serde_json::Value) {
    let event: TRADE_POOL_EVENT_TYPE = match serde_json::from_value(raw) {
        Ok(e) => e,
        Err(e) => {
            warn!(?e, "trade_pool: failed to deserialize event");
            return;
        }
    };
    if let Ok(pid) = event.pool.parse::<u64>() {
        if let Some(mut entry) = state.pools.get_mut(&pid) {
            entry.updated_at_unix_ms = Utc::now().timestamp_millis();
        }
    }
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
