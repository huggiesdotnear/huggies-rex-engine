//! huggies_rex_token_record_type
//!
//! In-memory representation of a token's metadata + market state.
// =========================================
use serde::{Deserialize, Serialize};
// =========================================
/// One row in the in-memory + sqlite-backed token table.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TOKEN_RECORD_TYPE {
    pub account_id: String,
    pub symbol: String,
    pub name: String,
    pub decimals: u8,
    pub icon: Option<String>,
    pub price_usd: Option<f64>,
    pub updated_at_unix_ms: i64,
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
