//! huggies_rex_page_pool_route
// =========================================
use askama::Template;
use axum::extract::Path;
use axum::response::{IntoResponse, Response};

use crate::logic::fun::template_into_response_fun::HUGGIES_REX_HTML;
// =========================================
#[derive(Template)]
#[template(path = "pool.html")]
pub struct POOL_TEMPLATE {
    pub pool_id: u64,
}
// =========================================
pub async fn huggies_rex_page_pool_route(Path(pool_id): Path<u64>) -> Response {
    HUGGIES_REX_HTML(POOL_TEMPLATE { pool_id }).into_response()
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
