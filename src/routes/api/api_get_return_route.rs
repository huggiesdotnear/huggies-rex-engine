//! huggies_rex_api_get_return_route
// =========================================
use std::sync::Arc;

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
    /// Human-readable amount (e.g. "5.5"). The server converts to
    /// raw using `token_in`'s decimals from the price-indexer.
    pub amount: Option<String>,
    /// Raw amount as a decimal string. Use this for power-user /
    /// scripting contexts where you already know the on-wire units.
    /// If both `amount` and `amount_raw` are given, `amount_raw`
    /// wins.
    pub amount_raw: Option<String>,
    /// Backwards-compat alias used by older clients.
    pub amount_in: Option<String>,
}
// =========================================
pub async fn huggies_rex_api_get_return_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
    Query(params): Query<GET_RETURN_QUERY_TYPE>,
) -> Result<Json<ROUTE_QUOTES_TYPE>, axum::http::StatusCode> {
    let token_in_decimals = state.tokens.get(&params.token_in).and_then(|t| {
        if t.decimals == 0 {
            None
        } else {
            Some(t.decimals)
        }
    });
    // Resolve (raw_amount, human_repr) from the request. `amount_raw`
    // (legacy `amount_in`) wins over the human `amount`.
    let (raw_amount, human_repr): (u128, String) = if let Some(s) =
        params.amount_raw.as_ref().or(params.amount_in.as_ref())
    {
        let v: u128 = s.parse().map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
        (v, s.clone())
    } else if let Some(s) = params.amount.as_ref() {
        let raw = human_to_raw(s, token_in_decimals).ok_or(axum::http::StatusCode::BAD_REQUEST)?;
        (raw, s.clone())
    } else {
        return Err(axum::http::StatusCode::BAD_REQUEST);
    };
    let amount_in_str = raw_amount.to_string();
    let pools_snapshot: std::collections::HashMap<u64, _> = state
        .pools
        .iter()
        .map(|e| (e.key().clone(), e.value().clone()))
        .collect();
    let tokens_snapshot: std::collections::HashMap<String, _> = state
        .tokens
        .iter()
        .map(|e| (e.key().clone(), e.value().clone()))
        .collect();
    let mut routes = huggies_rex_find_all_routes_fun(
        &pools_snapshot,
        &params.token_in,
        &params.token_out,
        raw_amount,
        &tokens_snapshot,
    );
    // Fallback to rhea RPC for direct SIMPLE_POOL quotes when the local
    // BFS found nothing. We only call rhea when we're 100% sure the
    // pool is a 2-token SIMPLE_POOL that contains BOTH the input and
    // output token — otherwise the contract panics with E76 invalid
    // params. Also require a non-trivial amount to avoid 0/yocto spam.
    if routes.is_empty() && raw_amount >= 1_000 {
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
            if let Ok(out) = rhea_get_return(
                &near,
                &state.rhea_contract_id,
                pool_id as u32,
                &params.token_in,
                &amount_in_str,
                &params.token_out,
            )
            .await
            {
                routes.push(crate::logic::types::route_quote_type::ROUTE_QUOTE_TYPE {
                    token_in: params.token_in.clone(),
                    token_out: params.token_out.clone(),
                    amount_in: amount_in_str.clone(),
                    amount_out: out.clone(),
                    hops: vec![crate::logic::types::route_quote_type::ROUTE_HOP_TYPE {
                        pool_id,
                        token_in: params.token_in.clone(),
                        token_out: params.token_out.clone(),
                        amount_in: crate::logic::types::token_amount_type::TOKEN_AMOUNT_TYPE::new(
                            amount_in_str.clone(),
                            token_in_decimals,
                            None,
                        ),
                        amount_out: crate::logic::types::token_amount_type::TOKEN_AMOUNT_TYPE::new(
                            out, None, None,
                        ),
                    }],
                    source: ROUTE_SOURCE_TYPE::Rpc,
                });
            }
        }
    }
    Ok(Json(ROUTE_QUOTES_TYPE {
        token_in: params.token_in,
        token_out: params.token_out,
        amount_in: human_repr,
        routes,
    }))
}
// =========================================
/// Convert a human-readable decimal amount like "5.5" or "0.001" to
/// a raw integer string by multiplying by 10^decimals. Pure function
/// — the source of truth for decimals is the in-memory token map
/// (populated from the price-indexer). Returns None on parse error
/// or missing decimals.
pub fn human_to_raw(human: &str, decimals: Option<u8>) -> Option<u128> {
    let s = human.trim();
    if s.is_empty() {
        return None;
    }
    if !s.chars().all(|c| c.is_ascii_digit() || c == '.') {
        return None;
    }
    let (whole, frac) = match s.split_once('.') {
        Some((w, f)) => (w, f),
        None => (s, ""),
    };
    let dec = decimals.unwrap_or(0) as usize;
    let frac_padded: String = format!("{:0<dec$}", frac);
    let combined = format!("{whole}{frac_padded}");
    if combined.is_empty() {
        return None;
    }
    combined.parse::<u128>().ok()
}
// =========================================
#[cfg(test)]
mod tests {
    use super::human_to_raw;
    #[test]
    fn human_24_decimals() {
        assert_eq!(human_to_raw("5", Some(24)), Some(5 * 10u128.pow(24)));
        assert_eq!(human_to_raw("5.5", Some(24)), Some(55 * 10u128.pow(23)));
        assert_eq!(human_to_raw("0.001", Some(24)), Some(10u128.pow(21)));
    }
    #[test]
    fn human_6_decimals() {
        // USDT has 6 decimals
        assert_eq!(human_to_raw("1.5", Some(6)), Some(1_500_000));
    }
    #[test]
    fn human_zero_decimals() {
        assert_eq!(human_to_raw("42", Some(0)), Some(42));
    }
    #[test]
    fn human_no_decimals() {
        // unknown token: passthrough
        assert_eq!(human_to_raw("5", None), Some(5));
    }
    #[test]
    fn human_invalid() {
        assert_eq!(human_to_raw("", Some(24)), None);
        assert_eq!(human_to_raw("abc", Some(24)), None);
        assert_eq!(human_to_raw("-5", Some(24)), None);
    }
    #[test]
    fn human_trailing_dot() {
        // "5." should work
        assert_eq!(human_to_raw("5.", Some(0)), Some(5));
    }
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
