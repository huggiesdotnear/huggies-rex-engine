//! huggies_rex_api_search_route
// =========================================
use std::sync::Arc;

use anyhow::Result;
use axum::Json;
use axum::extract::{Query, State};
use serde::Deserialize;

use crate::logic::fun::cache_search_fun::huggies_rex_cache_search_fun;
use crate::logic::types::app_state_type::APP_STATE_TYPE;
use crate::logic::types::search_hit_type::SEARCH_HIT_TYPE;
// =========================================
#[derive(Debug, Deserialize)]
pub struct SEARCH_QUERY_TYPE {
    pub q: Option<String>,
    #[serde(default = "default_limit")]
    pub limit: usize,
}
fn default_limit() -> usize {
    20
}
// =========================================
pub async fn huggies_rex_api_search_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
    Query(params): Query<SEARCH_QUERY_TYPE>,
) -> Result<Json<Vec<SEARCH_HIT_TYPE>>, axum::http::StatusCode> {
    let query = params.q.unwrap_or_default();
    if query.trim().is_empty() {
        return Ok(Json(Vec::new()));
    }
    let guard = state.sqlite.lock().await;
    match huggies_rex_cache_search_fun(&guard, &query, params.limit.max(1).min(100)) {
        Ok(hits) => Ok(Json(hits)),
        Err(e) => {
            tracing::warn!(?e, "search failed");
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
