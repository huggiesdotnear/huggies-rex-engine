// APP_ROUTER_FUN
// route map: api (/api/huggies/*) + the static folder served from
// `/` via ServeDir (the static folder is gitignored — populated by
// `bun build` in the frontend step).
//
// permissive CORS layer so the static `static/` directory (different
// origin from any deployed frontend) can hit /api/*. the backend is
// meant for personal use behind a trusted network, so we allow any
// origin + any method + any header. if you ever expose this to the
// public internet, lock the origin down with `CorsLayer::allow_origin([...].map(...))`.
// ====================================
use axum::{
    Router,
    extract::Request,
    http::{HeaderValue, Method, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::get,
};
use tower_http::{cors::CorsLayer, services::ServeDir};

use super::huggies_trezu_treasuries_route::huggies_trezu_treasuries_route;
use super::ping_route::ping_route;
// ====================================
// CORS preflight middleware — intercepts every OPTIONS request
// before any handler runs and returns 204 with CORS headers.
// ====================================
async fn cors_preflight_middleware_fun(req: Request, next: Next) -> Response {
    if req.method() == Method::OPTIONS {
        return (
            StatusCode::NO_CONTENT,
            [
                ("access-control-allow-origin", "*"),
                (
                    "access-control-allow-methods",
                    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                ),
                ("access-control-allow-headers", "*"),
                ("access-control-max-age", "86400"),
            ],
        )
            .into_response();
    }
    next.run(req).await
}
// ====================================
// fresh_static_middleware_fun — force the browser to re-validate on
// every request to the static folder. without this, the user's
// browser may hold onto an old page_settings_html.js even after a
// rebuild. no-cache, must-revalidate lets the browser keep a cached
// copy but requires it to re-check ETag/Last-Modified first, which
// is exactly what we want for hand-rolled static JS. NO_CONTENT
// responses (CORS preflight) are left alone.
// ====================================
async fn fresh_static_middleware_fun(req: Request, next: Next) -> Response {
    let mut res = next.run(req).await;
    if res.status() != StatusCode::NO_CONTENT {
        res.headers_mut().insert(
            axum::http::HeaderName::from_static("cache-control"),
            axum::http::HeaderValue::from_static("no-cache, must-revalidate"),
        );
    }
    res
}
// ====================================
pub fn app_router_fun() -> Router {
    let cors = CorsLayer::new()
        .allow_origin(HeaderValue::from_static("*"))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers(tower_http::cors::Any)
        .max_age(std::time::Duration::from_secs(86400));
    // --------------------------------------------------------
    // api router: only /api/huggies/* lives here. the static
    // ServeDir lives at `/` as the FALLBACK so any unmatched GET
    // (the html root + every .html page + the js/ + img/ trees)
    // is served from the (gitignored) static folder built by
    // the frontend bun step. /api/* still takes precedence
    // because it's registered on the outer Router.
    // --------------------------------------------------------
    let api_router = Router::new()
        .route("/api/huggies/ping", get(ping_route))
        .route(
            "/api/huggies/treasuries",
            get(huggies_trezu_treasuries_route),
        );
    // --------------------------------------------------------
    // static fallback lives in its own inner router so the
    // fresh_static_middleware_fun (Cache-Control: no-cache,
    // must-revalidate) tags only HTML / JS responses. applying
    // it to the whole router would also tag /api/* responses,
    // clobbering any future ETag-based caching on the api layer.
    // --------------------------------------------------------
    let static_service = ServeDir::new("static");
    let static_router = Router::new()
        .fallback_service(static_service)
        .layer(middleware::from_fn(fresh_static_middleware_fun));
    Router::new()
        .merge(api_router)
        .merge(static_router)
        // outer→inner layer order (axum wraps them in reverse
        // declaration order around the request):
        //   - cors preflight: intercepts OPTIONS, short-circuits to
        //     204 with CORS headers.
        //   - cors: adds CORS headers to every other response.
        .layer(cors)
        .layer(middleware::from_fn(cors_preflight_middleware_fun))
}
// ====================================
// copyright 2026 by sleet.near
