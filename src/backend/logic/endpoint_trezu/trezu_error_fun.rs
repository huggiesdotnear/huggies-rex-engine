// TREZU_ERROR_FUN
// the one json error shape every failure of the treasuries proxy answers
// with. keeps the client side parsing trivial: it always gets
// `{ "error": { "code", "message" } }` on a non-2xx.
// ====================================
use axum::{Json, http::StatusCode, response::IntoResponse};
// ====================================
pub fn trezu_error_fun(status: StatusCode, code: &str, message: &str) -> impl IntoResponse {
    (
        status,
        Json(serde_json::json!({
            "error": {
                "code": code,
                "message": message,
            }
        })),
    )
}
// ====================================
// copyright 2026 by sleet.near
