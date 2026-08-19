//! huggies_rex_api_get_return_route
// =========================================
use std::sync::Arc;

use anyhow::Context;
use axum::Json;
use axum::extract::{Query, State};
use near_kit_tool_box::fun::rhea::rhea_get_return_fun_json::get_return as rhea_get_return;
use serde::Deserialize;

use crate::logic::fun::find_best_route_fun::huggies_rex_find_best_route_fun;
use crate::logic::types::app_state_type::APP_STATE_TYPE;
use crate::logic::types::route_quote_type::{ROUTE_QUOTE_TYPE, ROUTE_SOURCE_TYPE};
// =========================================
#[derive(Debug, Deserialize)]
pub struct GET_RETURN_QUERY_TYPE {
    pub token_in: String,
    pub token_out: String,
    pub amount_in: String,
}
// =========================================
pub async fn huggies_rex_api_get_return_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
    Query(params): Query<GET_RETURN_QUERY_TYPE>,
) -> Result<Json<ROUTE_QUOTE_TYPE>, axum::http::StatusCode> {
    let amount_in: u128 = params
        .amount_in
        .parse()
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
    let pools_snapshot = state
        .pools
        .iter()
        .map(|e| (e.key().clone(), e.value().clone()))
        .collect();
    if let Some(local) = huggies_rex_find_best_route_fun(
        &pools_snapshot,
        &params.token_in,
        &params.token_out,
        amount_in,
    ) {
        return Ok(Json(local));
    }
    // Fallback: ask rhea directly. We need a single pool_id, so we try
    // the first SIMPLE_POOL containing both tokens.
    let pool_id_opt = state.pools.iter().find_map(|entry| {
        let p = entry.value();
        if p.pool_kind == "SIMPLE_POOL"
            && p.token_account_ids.contains(&params.token_in)
            && p.token_account_ids.contains(&params.token_out)
        {
            Some(entry.key().clone())
        } else {
            None
        }
    });
    let Some(pool_id) = pool_id_opt else {
        return Err(axum::http::StatusCode::NOT_FOUND);
    };
    let near = state.near_view.next_near();
    let out = rhea_get_return(
        &near,
        &state.rhea_contract_id,
        pool_id as u32,
        &params.token_in,
        &params.amount_in,
        &params.token_out,
    )
    .await
    .context("rhea get_return failed")
    .map_err(|_| axum::http::StatusCode::BAD_GATEWAY)?;
    Ok(Json(ROUTE_QUOTE_TYPE {
        token_in: params.token_in,
        token_out: params.token_out,
        amount_in: params.amount_in,
        amount_out: out,
        hops: Vec::new(),
        source: ROUTE_SOURCE_TYPE::Rpc,
    }))
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
