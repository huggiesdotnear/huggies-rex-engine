//! huggies_rex_pool_record_type
//!
//! In-memory representation of a rhea / ref-finance pool.
// =========================================
use serde::{Deserialize, Serialize};
// =========================================
/// One row in the in-memory + sqlite-backed pool table.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct POOL_RECORD_TYPE {
    pub pool_id: u64,
    pub pool_kind: String,
    pub token_account_ids: Vec<String>,
    pub amounts: Vec<String>,
    pub total_fee: u32,
    pub shares_total_supply: String,
    pub amp: u64,
    pub tvl_usd: Option<f64>,
    pub updated_at_unix_ms: i64,
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
