//! huggies_rex_watchlist_entry_type
//!
//! A single token the user wants to keep an eye on, stored in
//! `watchlist.json` in the user vault.
// =========================================
use serde::{Deserialize, Serialize};
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WATCHLIST_ENTRY_TYPE {
    pub token_account_id: String,
    pub note: Option<String>,
    pub added_at_unix_ms: i64,
}
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WATCHLIST_FILE_TYPE {
    pub entries: Vec<WATCHLIST_ENTRY_TYPE>,
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
