//! huggies_rex_api_arb_route
// =========================================
use std::sync::Arc;

use axum::Json;
use axum::extract::{Query, State};
use serde::Deserialize;

use crate::logic::fun::arb_round_trip_fun::{ARB_CYCLE_TYPE, huggies_rex_arb_round_trip_fun};
use crate::logic::types::app_state_type::APP_STATE_TYPE;
use crate::logic::types::route_quotes_type::ROUTE_QUOTES_TYPE;
use crate::routes::api::api_get_return_route::human_to_raw;
// =========================================
#[derive(Debug, Deserialize)]
pub struct ARB_QUERY_TYPE {
    pub token: String,
    /// Human-readable amount (e.g. "5.5"). The server converts to
    /// raw using `token`'s decimals from the price-indexer.
    pub amount: Option<String>,
    /// Raw amount as a decimal string. Wins over `amount` if both
    /// are given.
    pub amount_raw: Option<String>,
    /// Backwards-compat alias.
    pub amount_old: Option<String>,
    #[serde(default)]
    pub middle: Option<String>,
    #[serde(default = "default_max_hops")]
    pub max_hops: usize,
    #[serde(default = "default_max_cycles")]
    pub max_cycles: usize,
}
fn default_max_hops() -> usize {
    3
}
fn default_max_cycles() -> usize {
    12
}
// =========================================
pub async fn huggies_rex_api_arb_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
    Query(params): Query<ARB_QUERY_TYPE>,
) -> Result<Json<Vec<ARB_CYCLE_TYPE>>, axum::http::StatusCode> {
    let token_decimals = state.tokens.get(&params.token).and_then(|t| {
        if t.decimals == 0 {
            None
        } else {
            Some(t.decimals)
        }
    });
    let (raw_amount, human_repr): (u128, String) =
        if let Some(s) = params.amount_raw.as_ref().or(params.amount_old.as_ref()) {
            let v: u128 = s.parse().map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
            (v, s.clone())
        } else if let Some(s) = params.amount.as_ref() {
            let raw = human_to_raw(s, token_decimals).ok_or(axum::http::StatusCode::BAD_REQUEST)?;
            (raw, s.clone())
        } else {
            return Err(axum::http::StatusCode::BAD_REQUEST);
        };
    let pools_snapshot: std::collections::HashMap<u64, _> = state
        .pools
        .iter()
        .map(|e| (e.key().clone(), e.value().clone()))
        .collect();
    let raw_cycles = huggies_rex_arb_round_trip_fun(
        &pools_snapshot,
        &params.token,
        raw_amount,
        params.max_hops.clamp(2, 4),
        params.max_cycles.clamp(1, 50),
        params.middle.as_deref(),
    );
    // patch first hop's amount_in on every cycle to the cycle's amount_in
    let cycles: Vec<ARB_CYCLE_TYPE> = raw_cycles
        .into_iter()
        .map(|mut c| {
            if let Some(first) = c.hops.first_mut() {
                first.amount_in.raw = c.amount_in.clone();
            }
            c
        })
        .collect();
    // suppress unused variable warning
    let _ = ROUTE_QUOTES_TYPE {
        token_in: String::new(),
        token_out: String::new(),
        amount_in: human_repr,
        routes: Vec::new(),
    };
    Ok(Json(cycles))
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
