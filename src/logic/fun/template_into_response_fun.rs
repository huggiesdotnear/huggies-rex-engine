//! huggies_rex_template_into_response
//!
//! Tiny shim that turns any `askama::Template` into an axum
//! `IntoResponse` so we don't have to depend on the deprecated
//! `askama_axum` crate.
// =========================================
use askama::Template;
use axum::http::{StatusCode, header};
use axum::response::{IntoResponse, Response};
// =========================================
pub struct HUGGIES_REX_HTML<T: Template>(pub T);
// =========================================
impl<T: Template> IntoResponse for HUGGIES_REX_HTML<T> {
    fn into_response(self) -> Response {
        match self.0.render() {
            Ok(html) => (
                StatusCode::OK,
                [(header::CONTENT_TYPE, "text/html; charset=utf-8")],
                html,
            )
                .into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("template render failed: {e}"),
            )
                .into_response(),
        }
    }
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
