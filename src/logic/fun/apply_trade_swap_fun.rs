//! huggies_rex_apply_trade_swap_fun
//!
//! Apply a `trade_swap` event to in-memory state. We don't currently
//! mutate any pool on a trade_swap (the upstream trade_pool_change
//! carries the reserve deltas). We just build the broadcast event so
//! the UI shows it.
// =========================================
use tracing::warn;

use crate::logic::fun::events_ws_handler_fun::TRADE_SWAP_EVENT_TYPE;
use crate::logic::types::app_state_type::EVENT_BROADCAST_TYPE;
// =========================================
pub async fn huggies_rex_apply_trade_swap_fun(
    raw: serde_json::Value,
) -> Option<EVENT_BROADCAST_TYPE> {
    let event: TRADE_SWAP_EVENT_TYPE = match serde_json::from_value(raw) {
        Ok(e) => e,
        Err(e) => {
            warn!(?e, "trade_swap: failed to deserialize event");
            return None;
        }
    };
    let ts_unix_ms = (event.block_timestamp_nanosec / 1_000_000) as i64;
    Some(EVENT_BROADCAST_TYPE::TradeSwap {
        trader: event.trader,
        block_height: event.block_height,
        ts_unix_ms,
    })
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
