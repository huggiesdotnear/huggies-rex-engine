//! huggies_rex_trade_record_type
//!
//! One trade row in `trades.json` (append-only ledger). The structure
//! supports both `open` and `close` lifecycle events for a single trade.
// =========================================
use serde::{Deserialize, Serialize};
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TRADE_SIDE_TYPE {
    Open,
    Close,
    Free,
}
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TRADE_RECORD_TYPE {
    pub trade_id: String,
    pub account_id: String,
    pub pool_id: Option<u64>,
    pub token_in: String,
    pub token_out: String,
    pub amount_in: String,
    pub amount_out: String,
    pub price_usd_in: Option<f64>,
    pub price_usd_out: Option<f64>,
    pub side: TRADE_SIDE_TYPE,
    pub ts_unix_ms: i64,
    pub tx_hash: Option<String>,
    pub note: Option<String>,
}
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TRADES_FILE_TYPE {
    pub records: Vec<TRADE_RECORD_TYPE>,
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
