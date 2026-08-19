//! huggies_rex_page_pools_route
// =========================================
use askama::Template;
use axum::response::IntoResponse;

use crate::logic::fun::template_into_response_fun::HUGGIES_REX_HTML;
// =========================================
#[derive(Template)]
#[template(path = "pools.html")]
pub struct POOLS_TEMPLATE {}
// =========================================
pub async fn huggies_rex_page_pools_route() -> impl IntoResponse {
    HUGGIES_REX_HTML(POOLS_TEMPLATE {})
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
