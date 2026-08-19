//! huggies_rex_app_state_type
//!
//! Shared application state injected into every axum handler.
// =========================================
use std::sync::Arc;

use dashmap::DashMap;
use near_kit_tool_box::lib::load_balancer::load_balancing_near::LOAD_BALANCING_NEAR;
use rusqlite::Connection;
use tokio::sync::Mutex;
use tokio::sync::broadcast;

use crate::logic::types::pool_record_type::POOL_RECORD_TYPE;
use crate::logic::types::token_record_type::TOKEN_RECORD_TYPE;
// =========================================
/// Container for every piece of shared state used by axum handlers.
pub struct APP_STATE_TYPE {
    pub near_view: LOAD_BALANCING_NEAR,
    pub rhea_contract_id: String,
    pub pools: DashMap<u64, POOL_RECORD_TYPE>,
    pub tokens: DashMap<String, TOKEN_RECORD_TYPE>,
    pub sqlite: Mutex<Connection>,
    pub vault_dir: String,
    pub event_tx: broadcast::Sender<EVENT_BROADCAST_TYPE>,
}
// =========================================
#[derive(Debug, Clone, serde::Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum EVENT_BROADCAST_TYPE {
    TradePool {
        pool_id: String,
        token_in: String,
        token_out: String,
        amount_in: String,
        amount_out: String,
        trader: String,
        block_height: u64,
        ts_unix_ms: i64,
    },
    TradePoolChange {
        pool_id: String,
        pool_kind: String,
        token_account_ids: Vec<String>,
        amounts: Vec<String>,
        total_fee: u32,
        ts_unix_ms: i64,
    },
    TradeSwap {
        trader: String,
        block_height: u64,
        ts_unix_ms: i64,
    },
    Heartbeat {
        ts_unix_ms: i64,
    },
}
// =========================================
pub type SharedAppState = Arc<APP_STATE_TYPE>;
// =========================================
// =========================================
// copyright 2026 by sleet.near
