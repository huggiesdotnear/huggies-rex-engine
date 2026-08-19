//! huggies_rex_page_index_route
// =========================================
use std::sync::Arc;

use askama::Template;
use axum::extract::State;
use axum::response::IntoResponse;

use crate::logic::constants::trading_const::DEFAULT_TRADER_ACCOUNT_ID;
use crate::logic::fun::template_into_response_fun::HUGGIES_REX_HTML;
use crate::logic::types::app_state_type::APP_STATE_TYPE;
// =========================================
#[derive(Template)]
#[template(path = "index.html")]
pub struct INDEX_TEMPLATE {
    pub default_trader: &'static str,
}
// =========================================
pub async fn huggies_rex_page_index_route(
    State(_state): State<Arc<APP_STATE_TYPE>>,
) -> impl IntoResponse {
    HUGGIES_REX_HTML(INDEX_TEMPLATE {
        default_trader: DEFAULT_TRADER_ACCOUNT_ID,
    })
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
