//! huggies_rex_page_profile_route
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
#[template(path = "profile.html")]
pub struct PROFILE_TEMPLATE {
    pub default_trader: &'static str,
    pub vault_dir: String,
}
// =========================================
pub async fn huggies_rex_page_profile_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
) -> impl IntoResponse {
    HUGGIES_REX_HTML(PROFILE_TEMPLATE {
        default_trader: DEFAULT_TRADER_ACCOUNT_ID,
        vault_dir: state.vault_dir.clone(),
    })
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
