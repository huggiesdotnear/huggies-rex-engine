//! huggies_rex_router_fun
// =========================================
use std::sync::Arc;

use axum::Router;
use axum::routing::{delete, get};
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;

use crate::logic::types::app_state_type::APP_STATE_TYPE;
use crate::routes::api::api_arb_route::huggies_rex_api_arb_route;
use crate::routes::api::api_follows_route::{
    huggies_rex_api_follows_add_route, huggies_rex_api_follows_get_route,
    huggies_rex_api_follows_remove_route,
};
use crate::routes::api::api_get_return_compare_route::huggies_rex_api_get_return_compare_route;
use crate::routes::api::api_get_return_route::huggies_rex_api_get_return_route;
use crate::routes::api::api_pool_route::huggies_rex_api_pool_route;
use crate::routes::api::api_pools_route::huggies_rex_api_pools_route;
use crate::routes::api::api_search_route::huggies_rex_api_search_route;
use crate::routes::api::api_token_pools_route::huggies_rex_api_token_pools_route;
use crate::routes::api::api_token_route::huggies_rex_api_token_route;
use crate::routes::api::api_tokens_route::huggies_rex_api_tokens_route;
use crate::routes::api::api_trader_route::huggies_rex_api_trader_route;
use crate::routes::api::api_watchlist_route::{
    huggies_rex_api_watchlist_add_route, huggies_rex_api_watchlist_get_route,
    huggies_rex_api_watchlist_remove_route,
};
use crate::routes::pages::page_index_route::huggies_rex_page_index_route;
use crate::routes::pages::page_pool_route::huggies_rex_page_pool_route;
use crate::routes::pages::page_pools_route::huggies_rex_page_pools_route;
use crate::routes::pages::page_profile_route::huggies_rex_page_profile_route;
use crate::routes::pages::page_stream_route::huggies_rex_page_stream_route;
use crate::routes::pages::page_swap_route::huggies_rex_page_swap_route;
use crate::routes::pages::page_token_route::huggies_rex_page_token_route;
use crate::routes::pages::page_trader_route::huggies_rex_page_trader_route;
use crate::routes::ws_events_route::huggies_rex_ws_events_route;
// =========================================
pub fn huggies_rex_router_fun(state: Arc<APP_STATE_TYPE>) -> Router {
    let api = Router::new()
        .route("/api/pools", get(huggies_rex_api_pools_route))
        .route("/api/pool/{id}", get(huggies_rex_api_pool_route))
        .route("/api/tokens", get(huggies_rex_api_tokens_route))
        .route("/api/token/{id}", get(huggies_rex_api_token_route))
        .route(
            "/api/token/{id}/pools",
            get(huggies_rex_api_token_pools_route),
        )
        .route("/api/search", get(huggies_rex_api_search_route))
        .route("/api/get_return", get(huggies_rex_api_get_return_route))
        .route(
            "/api/get_return_compare",
            get(huggies_rex_api_get_return_compare_route),
        )
        .route("/api/arb", get(huggies_rex_api_arb_route))
        .route(
            "/api/trader/{account_id}",
            get(huggies_rex_api_trader_route),
        )
        .route(
            "/api/watchlist",
            get(huggies_rex_api_watchlist_get_route).post(huggies_rex_api_watchlist_add_route),
        )
        .route(
            "/api/watchlist/remove",
            delete(huggies_rex_api_watchlist_remove_route),
        )
        .route(
            "/api/follows",
            get(huggies_rex_api_follows_get_route).post(huggies_rex_api_follows_add_route),
        )
        .route(
            "/api/follows/remove",
            delete(huggies_rex_api_follows_remove_route),
        );
    let pages = Router::new()
        .route("/", get(huggies_rex_page_index_route))
        .route("/swap", get(huggies_rex_page_swap_route))
        .route("/pools", get(huggies_rex_page_pools_route))
        .route("/pool/{id}", get(huggies_rex_page_pool_route))
        .route("/token/{id}", get(huggies_rex_page_token_route))
        .route("/trader/{account_id}", get(huggies_rex_page_trader_route))
        .route("/stream", get(huggies_rex_page_stream_route))
        .route("/profile", get(huggies_rex_page_profile_route));
    let ws = Router::new().route("/ws", get(huggies_rex_ws_events_route));
    Router::new()
        .merge(api)
        .merge(pages)
        .merge(ws)
        .nest_service("/static", ServeDir::new("static"))
        .layer(CorsLayer::permissive())
        .with_state(state)
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
