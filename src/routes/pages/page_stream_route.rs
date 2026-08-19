//! huggies_rex_page_stream_route
// =========================================
use askama::Template;
use axum::response::IntoResponse;

use crate::logic::fun::template_into_response_fun::HUGGIES_REX_HTML;
// =========================================
#[derive(Template)]
#[template(path = "stream.html")]
pub struct STREAM_TEMPLATE {}
// =========================================
pub async fn huggies_rex_page_stream_route() -> impl IntoResponse {
    HUGGIES_REX_HTML(STREAM_TEMPLATE {})
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
