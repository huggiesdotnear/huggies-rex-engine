//! huggies_rex_api_trader_route
//!
//! GET `/api/trader/{account_id}` — returns the rhea LP deposits and
//! the NEAR native balance for the given account id.
// =========================================
use std::sync::Arc;

use axum::Json;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use near_kit::types::AccountId;
use near_kit_tool_box::fun::near::view_account_fun_json::view_account;
use near_kit_tool_box::fun::rhea::rhea_get_deposits_fun_json::get_deposits;

use crate::logic::types::app_state_type::APP_STATE_TYPE;
use crate::logic::types::token_amount_type::TOKEN_AMOUNT_TYPE;
use crate::logic::types::trader_view_type::{TRADER_DEPOSIT_TYPE, TRADER_VIEW_TYPE};
// =========================================
pub async fn huggies_rex_api_trader_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
    Path(account_id): Path<String>,
) -> Response {
    let parsed: AccountId = match account_id.parse() {
        Ok(a) => a,
        Err(e) => {
            return (StatusCode::BAD_REQUEST, format!("invalid account id: {e}")).into_response();
        }
    };
    let near = state.near_view.next_near();
    let account = match view_account(&near, &account_id).await {
        Ok(a) => a,
        Err(e) => {
            return (StatusCode::BAD_GATEWAY, format!("view_account failed: {e}")).into_response();
        }
    };
    let deposits_map = match get_deposits(&near, &state.rhea_contract_id, &parsed).await {
        Ok(m) => m,
        Err(e) => {
            return (StatusCode::BAD_GATEWAY, format!("get_deposits failed: {e}")).into_response();
        }
    };
    let mut deposits: Vec<TRADER_DEPOSIT_TYPE> = Vec::new();
    for (token_id, shares) in deposits_map {
        // rhea returns the sum across all pools containing the token;
        // the value is 0 when the user does not actually hold LP for it.
        if shares == "0" {
            continue;
        }
        // best-effort: attach a concrete pool_id if there's a pool in
        // our state that contains this token, otherwise 0.
        let pool_id = state
            .pools
            .iter()
            .find(|p| p.value().token_account_ids.contains(&token_id))
            .map(|p| p.key().clone())
            .unwrap_or(0);
        // The values are NEP-141 token balances (not LP share MFTs);
        // use the underlying token's decimals from our in-memory
        // token map (populated from the price-indexer at boot).
        let (decimals, symbol) = state
            .tokens
            .get(&token_id)
            .map(|t| {
                let dec = if t.decimals == 0 {
                    None
                } else {
                    Some(t.decimals)
                };
                (dec, Some(t.symbol.clone()))
            })
            .unwrap_or((None, None));
        let shares_amount = TOKEN_AMOUNT_TYPE::new(shares, decimals, symbol);
        deposits.push(TRADER_DEPOSIT_TYPE {
            token_id,
            shares: shares_amount,
            pool_id,
        });
    }
    deposits.sort_by(|a, b| {
        let av: u128 = a.shares.raw.parse().unwrap_or(0);
        let bv: u128 = b.shares.raw.parse().unwrap_or(0);
        bv.cmp(&av)
    });
    let view = TRADER_VIEW_TYPE {
        account_id: parsed.to_string(),
        near_balance_yocto: account.amount.as_yoctonear().to_string(),
        deposits,
    };
    Json(view).into_response()
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
