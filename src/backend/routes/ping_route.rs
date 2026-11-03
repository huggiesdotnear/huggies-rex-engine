// PING_ROUTE
// GET /api/shit-1170/ping — basic liveness/ping endpoint. returns
// { "ok": true, "app": "shit-1170" } so a health checker can
// verify the axum program is up and which app it is.
// ====================================
use axum::{Json, response::IntoResponse};
// ====================================
pub async fn ping_route() -> impl IntoResponse {
    Json(serde_json::json!({
        "ok": true,
        "app": "shit-1170",
    }))
}
// ====================================
// copyright 2026 by sleet.near
