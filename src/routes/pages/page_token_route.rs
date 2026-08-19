//! huggies_rex_page_token_route
// =========================================
use askama::Template;
use axum::extract::Path;
use axum::response::IntoResponse;

use crate::logic::fun::template_into_response_fun::HUGGIES_REX_HTML;
// =========================================
#[derive(Template)]
#[template(path = "token.html")]
pub struct TOKEN_TEMPLATE {
    pub token_id: String,
}
// =========================================
pub async fn huggies_rex_page_token_route(Path(token_id): Path<String>) -> impl IntoResponse {
    HUGGIES_REX_HTML(TOKEN_TEMPLATE { token_id })
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
