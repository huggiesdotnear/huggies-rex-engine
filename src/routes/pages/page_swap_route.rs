//! huggies_rex_page_swap_route
// =========================================
use askama::Template;
use axum::response::IntoResponse;

use crate::logic::fun::template_into_response_fun::HUGGIES_REX_HTML;
// =========================================
#[derive(Template)]
#[template(path = "swap.html")]
pub struct SWAP_TEMPLATE {}
// =========================================
pub async fn huggies_rex_page_swap_route() -> impl IntoResponse {
    HUGGIES_REX_HTML(SWAP_TEMPLATE {})
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
