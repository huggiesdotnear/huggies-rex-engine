//! huggies_rex_api_pool_route
// =========================================
use std::sync::Arc;

use axum::Json;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

use crate::logic::types::app_state_type::APP_STATE_TYPE;
// =========================================
pub async fn huggies_rex_api_pool_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
    Path(pool_id): Path<u64>,
) -> Response {
    match state.pools.get(&pool_id) {
        Some(p) => Json(p.value().clone()).into_response(),
        None => (StatusCode::NOT_FOUND, format!("pool {pool_id} not found")).into_response(),
    }
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
