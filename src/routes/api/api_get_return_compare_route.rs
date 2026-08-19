//! huggies_rex_api_get_return_compare_route
// =========================================
use std::sync::Arc;

use anyhow::Context;
use axum::Json;
use axum::extract::{Query, State};
use serde::Deserialize;

use crate::logic::fun::get_return_compare_fun::{
    GET_RETURN_COMPARE_TYPE, huggies_rex_get_return_compare_fun,
};
use crate::logic::types::app_state_type::APP_STATE_TYPE;
// =========================================
#[derive(Debug, Deserialize)]
pub struct GET_RETURN_COMPARE_QUERY_TYPE {
    pub pool_id: u64,
    pub token_in: String,
    pub token_out: String,
    pub amount_in: String,
}
// =========================================
pub async fn huggies_rex_api_get_return_compare_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
    Query(params): Query<GET_RETURN_COMPARE_QUERY_TYPE>,
) -> Result<Json<GET_RETURN_COMPARE_TYPE>, axum::http::StatusCode> {
    let pool = state
        .pools
        .get(&params.pool_id)
        .ok_or_else(|| axum::http::StatusCode::NOT_FOUND)?;
    let token_account_ids = &pool.token_account_ids;
    let amounts = &pool.amounts;
    let (reserve_in_idx, _) = if token_account_ids
        .first()
        .map(|t| t == &params.token_in)
        .unwrap_or(false)
    {
        (0usize, 1usize)
    } else if token_account_ids
        .get(1)
        .map(|t| t == &params.token_in)
        .unwrap_or(false)
    {
        (1usize, 0usize)
    } else {
        return Err(axum::http::StatusCode::BAD_REQUEST);
    };
    let reserve_in = amounts[reserve_in_idx].clone();
    let reserve_out = amounts[1 - reserve_in_idx].clone();
    let near = state.near_view.next_near();
    let result = huggies_rex_get_return_compare_fun(
        &near,
        &state.rhea_contract_id,
        params.pool_id,
        &pool.pool_kind,
        &reserve_in,
        &reserve_out,
        pool.total_fee,
        &params.token_in,
        &params.token_out,
        &params.amount_in,
    )
    .await
    .context("compare failed")
    .map_err(|_| axum::http::StatusCode::BAD_GATEWAY)?;
    Ok(Json(result))
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
