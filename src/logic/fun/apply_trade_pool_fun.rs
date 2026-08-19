//! huggies_rex_apply_trade_pool_fun
//!
//! Apply a `trade_pool` event to in-memory pool state. The event only
//! tells us a single swap happened; we update the `updated_at_unix_ms`
//! and bump the pool row so any UI re-render shows the trade. Returns
//! the broadcast event so the caller can ship it to /ws subscribers.
// =========================================
use chrono::Utc;
use tracing::warn;

use crate::logic::fun::events_ws_handler_fun::TRADE_POOL_EVENT_TYPE;
use crate::logic::types::app_state_type::{APP_STATE_TYPE, EVENT_BROADCAST_TYPE};
// =========================================
pub async fn huggies_rex_apply_trade_pool_fun(
    state: &APP_STATE_TYPE,
    raw: serde_json::Value,
) -> Option<EVENT_BROADCAST_TYPE> {
    let event: TRADE_POOL_EVENT_TYPE = match serde_json::from_value(raw) {
        Ok(e) => e,
        Err(e) => {
            warn!(?e, "trade_pool: failed to deserialize event");
            return None;
        }
    };
    let pool_id_str = event.pool.clone();
    if let Ok(pid) = event.pool.parse::<u64>() {
        if let Some(mut entry) = state.pools.get_mut(&pid) {
            entry.updated_at_unix_ms = Utc::now().timestamp_millis();
        }
    }
    let ts_unix_ms = (event.block_timestamp_nanosec / 1_000_000) as i64;
    Some(EVENT_BROADCAST_TYPE::TradePool {
        pool_id: pool_id_str,
        token_in: event.token_in,
        token_out: event.token_out,
        amount_in: event.amount_in.to_string(),
        amount_out: event.amount_out.to_string(),
        trader: event.trader,
        block_height: event.block_height,
        ts_unix_ms,
    })
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
