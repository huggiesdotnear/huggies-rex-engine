//! huggies_rex_api_token_route
// =========================================
use std::sync::Arc;

use axum::Json;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

use crate::logic::types::app_state_type::APP_STATE_TYPE;
// =========================================
pub async fn huggies_rex_api_token_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
    Path(account_id): Path<String>,
) -> Response {
    match state.tokens.get(&account_id) {
        Some(t) => Json(t.value().clone()).into_response(),
        None => (
            StatusCode::NOT_FOUND,
            format!("token {account_id} not found"),
        )
            .into_response(),
    }
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
