//! huggies_rex_search_hit_type
//!
//! Row returned by the `/api/search` endpoint for tokens and pools.
// =========================================
use serde::{Deserialize, Serialize};
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SEARCH_HIT_KIND_TYPE {
    Token,
    Pool,
}
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SEARCH_HIT_TYPE {
    pub kind: SEARCH_HIT_KIND_TYPE,
    pub id: String,
    pub label: String,
    pub sub_label: Option<String>,
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
