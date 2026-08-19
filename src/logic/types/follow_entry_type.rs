//! huggies_rex_follow_entry_type
//!
//! A single trader account the user is following, stored in
//! `follows.json` in the user vault.
// =========================================
use serde::{Deserialize, Serialize};
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FOLLOW_ENTRY_TYPE {
    pub account_id: String,
    pub note: Option<String>,
    pub added_at_unix_ms: i64,
}
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FOLLOWS_FILE_TYPE {
    pub entries: Vec<FOLLOW_ENTRY_TYPE>,
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
