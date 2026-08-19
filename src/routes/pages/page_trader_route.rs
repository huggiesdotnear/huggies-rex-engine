//! huggies_rex_page_trader_route
// =========================================
use askama::Template;
use axum::extract::Path;
use axum::response::IntoResponse;

use crate::logic::fun::template_into_response_fun::HUGGIES_REX_HTML;
// =========================================
#[derive(Template)]
#[template(path = "trader.html")]
pub struct TRADER_TEMPLATE {
    pub account_id: String,
}
// =========================================
pub async fn huggies_rex_page_trader_route(Path(account_id): Path<String>) -> impl IntoResponse {
    HUGGIES_REX_HTML(TRADER_TEMPLATE { account_id })
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
