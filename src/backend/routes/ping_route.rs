// PING_ROUTE
// GET /api/huggies/ping — basic liveness/ping endpoint. returns
// { "ok": true, "app": "huggies-rex-engine" } so a health checker can
// verify the axum program is up and which app it is.
// ====================================
use axum::{Json, response::IntoResponse};
// ====================================
pub async fn ping_route() -> impl IntoResponse {
    Json(serde_json::json!({
        "ok": true,
        "app": "huggies-rex-engine",
    }))
}
// ====================================
// copyright 2026 by sleet.near
