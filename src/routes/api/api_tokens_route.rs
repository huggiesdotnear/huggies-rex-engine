//! huggies_rex_api_tokens_route
// =========================================
use std::sync::Arc;

use axum::Json;
use axum::extract::State;

use crate::logic::types::app_state_type::APP_STATE_TYPE;
use crate::logic::types::token_record_type::TOKEN_RECORD_TYPE;
// =========================================
pub async fn huggies_rex_api_tokens_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
) -> Json<Vec<TOKEN_RECORD_TYPE>> {
    let mut out: Vec<TOKEN_RECORD_TYPE> = state
        .tokens
        .iter()
        .map(|entry| entry.value().clone())
        .collect();
    out.sort_by(|a, b| a.symbol.cmp(&b.symbol));
    Json(out)
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
