//! huggies_rex_api_token_pools_route
//!
//! GET `/api/token/{account_id}/pools` — every pool that contains the
//! given token.
// =========================================
use std::sync::Arc;

use axum::Json;
use axum::extract::{Path, State};

use crate::logic::types::app_state_type::APP_STATE_TYPE;
use crate::logic::types::pool_record_type::POOL_RECORD_TYPE;
// =========================================
pub async fn huggies_rex_api_token_pools_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
    Path(account_id): Path<String>,
) -> Json<Vec<POOL_RECORD_TYPE>> {
    let mut out: Vec<POOL_RECORD_TYPE> = state
        .pools
        .iter()
        .filter(|p| p.value().token_account_ids.iter().any(|t| t == &account_id))
        .map(|p| p.value().clone())
        .collect();
    out.sort_by_key(|p| p.pool_id);
    Json(out)
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
