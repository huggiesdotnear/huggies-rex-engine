//! huggies_rex_api_get_return_route
// =========================================
use std::sync::Arc;

use anyhow::Context;
use axum::Json;
use axum::extract::{Query, State};
use near_kit_tool_box::fun::rhea::rhea_get_return_fun_json::get_return as rhea_get_return;
use serde::Deserialize;

use crate::logic::fun::find_all_routes_fun::huggies_rex_find_all_routes_fun;
use crate::logic::types::app_state_type::APP_STATE_TYPE;
use crate::logic::types::route_quote_type::ROUTE_SOURCE_TYPE;
use crate::logic::types::route_quotes_type::ROUTE_QUOTES_TYPE;
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
) -> Result<Json<ROUTE_QUOTES_TYPE>, axum::http::StatusCode> {
    let amount_in: u128 = params
        .amount_in
        .parse()
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
    let pools_snapshot: std::collections::HashMap<u64, _> = state
        .pools
        .iter()
        .map(|e| (e.key().clone(), e.value().clone()))
        .collect();
    let mut routes = huggies_rex_find_all_routes_fun(
        &pools_snapshot,
        &params.token_in,
        &params.token_out,
        amount_in,
    );
    // Fallback to rhea RPC for direct SIMPLE_POOL quotes when the local
    // BFS found nothing. We only call rhea when we're 100% sure the
    // pool is a 2-token SIMPLE_POOL that contains BOTH the input and
    // output token — otherwise the contract panics with E76 invalid
    // params. Also require a non-trivial amount to avoid 0/yocto spam.
    if routes.is_empty() && amount_in >= 1_000 {
        let direct_pool_opt = state.pools.iter().find_map(|entry| {
            let p = entry.value();
            if p.pool_kind == "SIMPLE_POOL"
                && p.token_account_ids.len() == 2
                && p.token_account_ids[0] == params.token_in
                && p.token_account_ids[1] == params.token_out
            {
                Some(entry.key().clone())
            } else {
                None
            }
        });
        if let Some(pool_id) = direct_pool_opt {
            let near = state.near_view.next_near();
            match rhea_get_return(
                &near,
                &state.rhea_contract_id,
                pool_id as u32,
                &params.token_in,
                &params.amount_in,
                &params.token_out,
            )
            .await
            {
                Ok(out) => {
                    routes.push(crate::logic::types::route_quote_type::ROUTE_QUOTE_TYPE {
                        token_in: params.token_in.clone(),
                        token_out: params.token_out.clone(),
                        amount_in: params.amount_in.clone(),
                        amount_out: out.clone(),
                        hops: vec![crate::logic::types::route_quote_type::ROUTE_HOP_TYPE {
                            pool_id,
                            token_in: params.token_in.clone(),
                            token_out: params.token_out.clone(),
                            amount_in: params.amount_in.clone(),
                            amount_out: out,
                        }],
                        source: ROUTE_SOURCE_TYPE::Rpc,
                    });
                }
                Err(e) => {
                    tracing::warn!(?e, "rhea get_return fallback failed; skipping");
                }
            }
        }
    }
    Ok(Json(ROUTE_QUOTES_TYPE {
        token_in: params.token_in,
        token_out: params.token_out,
        amount_in: params.amount_in,
        routes,
    }))
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
