// APP_ROUTER_FUN
// route map: api (/api/shit-1170/* + /api/trezu/*) + the static folder
// served from `/` via ServeDir (gitignored, filled by `bun build`).
//
// SECURITY: the CORS layer is deliberately permissive (any origin, any
// method, any header) so a static `static/` folder on a different
// origin can hit /api/*. this backend is for personal use behind a
// trusted network. if you expose it to the public internet, lock the
// origin down with `CorsLayer::allow_origin([...].map(...))`.
// ====================================
use axum::{
    Router,
    extract::Request,
    http::{HeaderValue, Method, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{delete, get, post},
};
use sqlx::SqlitePool;
use tower_http::{cors::CorsLayer, services::ServeDir};

use super::api_key_me_route::api_key_me_route;
use super::api_key_rotate_route::api_key_rotate_route;
use super::api_keys_route::api_keys_route;
use super::ping_route::ping_route;
use super::trezu_treasuries_route::trezu_treasuries_route;
use super::tx_queue_accounts_delete_route::tx_queue_accounts_delete_route;
use super::tx_queue_accounts_route::tx_queue_accounts_route;
use super::tx_queue_one_route::tx_queue_one_route;
use super::tx_queue_route::{tx_queue_get_route, tx_queue_post_route};
use super::tx_queue_sent_route::tx_queue_sent_route;
use super::tx_queue_stats_contracts_route::tx_queue_stats_contracts_route;
use super::tx_queue_stats_methods_route::tx_queue_stats_methods_route;
use super::tx_queue_facets_route::tx_queue_facets_route;
use super::swap_queue_accounts_delete_route::swap_queue_accounts_delete_route;
use super::swap_queue_accounts_route::swap_queue_accounts_route;
use super::swap_queue_one_route::swap_queue_one_route;
use super::swap_queue_route::{swap_queue_get_route, swap_queue_post_route};
use super::swap_queue_sent_route::swap_queue_sent_route;
// ====================================
// CORS preflight middleware — intercepts every OPTIONS request before
// any handler runs and answers 204 with CORS headers.
//
// WHY: tower_http's CorsLayer already answers preflight itself, but
// with a 200. this sits OUTSIDE the cors layer and short-circuits first.
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
// every request to the static folder. without this the browser may
// hold onto an old bundle after a rebuild. no-cache, must-revalidate
// lets it keep a cached copy but requires it to re-check ETag/
// Last-Modified first.
//
// WHY the NO_CONTENT guard: a 204 must not carry a body.
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
pub fn app_router_fun(pool: SqlitePool) -> Router {
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
    // api router: every /api/* route lives here, each under the api it
    // fronts. /api/shit-1170/* is our own (ping); /api/trezu/* fronts
    // the trezu api.
    // --------------------------------------------------------
    let api_router = Router::new()
        .route("/api/shit-1170/ping", get(ping_route))
        .route("/api/shit-1170/api-keys", post(api_keys_route))
        .route("/api/shit-1170/api-key/me", get(api_key_me_route))
        .route("/api/shit-1170/api-key/rotate", post(api_key_rotate_route))
        // the tx queue. the stats routes come BEFORE the `{queue_id}`
        // route, because axum matches the more specific path first and
        // `stats` would otherwise be read as a queue id.
        .route(
            "/api/shit-1170/tx-queue/stats/contracts",
            get(tx_queue_stats_contracts_route),
        )
        .route(
            "/api/shit-1170/tx-queue/stats/methods",
            get(tx_queue_stats_methods_route),
        )
        // the facets route — the contracts and the accounts the feed's
        // filter bar offers. it comes BEFORE the `{queue_id}` route for
        // the same reason the stats routes do: `facets` would otherwise
        // be read as a queue id.
        .route(
            "/api/shit-1170/tx-queue/facets",
            get(tx_queue_facets_route),
        )
        .route(
            "/api/shit-1170/tx-queue",
            post(tx_queue_post_route).get(tx_queue_get_route),
        )
        .route("/api/shit-1170/tx-queue/{queue_id}", get(tx_queue_one_route))
        .route(
            "/api/shit-1170/tx-queue/{queue_id}/accounts",
            post(tx_queue_accounts_route),
        )
        .route(
            "/api/shit-1170/tx-queue/{queue_id}/accounts/{account_id}",
            delete(tx_queue_accounts_delete_route),
        )
        .route(
            "/api/shit-1170/tx-queue/{queue_id}/sent",
            post(tx_queue_sent_route),
        )
        // the swap queue. a queued swap is NOT a queued batch of
        // transactions: the agent names the token in, the amount in and
        // the token out, and the route is worked out when it is
        // executed.
        .route(
            "/api/shit-1170/swap-queue",
            post(swap_queue_post_route).get(swap_queue_get_route),
        )
        .route("/api/shit-1170/swap-queue/{swap_id}", get(swap_queue_one_route))
        .route(
            "/api/shit-1170/swap-queue/{swap_id}/accounts",
            post(swap_queue_accounts_route),
        )
        .route(
            "/api/shit-1170/swap-queue/{swap_id}/accounts/{account_id}",
            delete(swap_queue_accounts_delete_route),
        )
        .route(
            "/api/shit-1170/swap-queue/{swap_id}/sent",
            post(swap_queue_sent_route),
        )
        .route("/api/trezu/user/treasuries", get(trezu_treasuries_route));
    // --------------------------------------------------------
    // static ServeDir is the FALLBACK at `/`, so any unmatched GET
    // (the html root + every .html page + the js/ + img/ trees) comes
    // from the gitignored static folder built by `bun build`. /api/*
    // still wins, because it is registered on the outer Router.
    //
    // it lives in its own inner router so the fresh_static_middleware_fun
    // (Cache-Control: no-cache, must-revalidate) tags only the static
    // responses. applying it to the whole router would also tag /api/*
    // responses, clobbering any future ETag-based caching.
    // --------------------------------------------------------
    let static_service = ServeDir::new("static");
    let static_router = Router::new()
        .fallback_service(static_service)
        .layer(middleware::from_fn(fresh_static_middleware_fun));
    Router::new()
        .merge(api_router)
        .merge(static_router)
        // the db pool is the router's state, so the routes that need the
        // db can reach it without opening a pool per request.
        .with_state(pool)
        // axum wraps layers in REVERSE declaration order, so the
        // request runs preflight -> cors -> route. the preflight
        // intercepts OPTIONS and short-circuits to 204 with CORS
        // headers; the cors layer adds headers to every other response.
        .layer(cors)
        .layer(middleware::from_fn(cors_preflight_middleware_fun))
}
// ====================================
// copyright 2026 by sleet.near
