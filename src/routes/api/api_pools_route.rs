//! huggies_rex_api_pools_route
// =========================================
use std::sync::Arc;

use axum::Json;
use axum::extract::State;
use serde::Serialize;

use crate::logic::types::app_state_type::APP_STATE_TYPE;
// =========================================
#[derive(Debug, Serialize)]
pub struct POOL_LIST_ITEM_TYPE {
    pub pool_id: u64,
    pub pool_kind: String,
    pub token_account_ids: Vec<String>,
    pub amounts: Vec<String>,
    pub total_fee: u32,
    pub shares_total_supply: String,
    pub tvl_usd: Option<f64>,
    pub updated_at_unix_ms: i64,
}
// =========================================
pub async fn huggies_rex_api_pools_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
) -> Json<Vec<POOL_LIST_ITEM_TYPE>> {
    let mut out: Vec<POOL_LIST_ITEM_TYPE> = state
        .pools
        .iter()
        .map(|entry| {
            let p = entry.value();
            POOL_LIST_ITEM_TYPE {
                pool_id: p.pool_id,
                pool_kind: p.pool_kind.clone(),
                token_account_ids: p.token_account_ids.clone(),
                amounts: p.amounts.clone(),
                total_fee: p.total_fee,
                shares_total_supply: p.shares_total_supply.clone(),
                tvl_usd: p.tvl_usd,
                updated_at_unix_ms: p.updated_at_unix_ms,
            }
        })
        .collect();
    out.sort_by_key(|p| p.pool_id);
    Json(out)
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
