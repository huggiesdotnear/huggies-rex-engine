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
    for (key, shares) in deposits_map {
        if let Some((pool_id_str, token_id)) = key.split_once(':') {
            if let Ok(pool_id) = pool_id_str.parse::<u64>() {
                deposits.push(TRADER_DEPOSIT_TYPE {
                    pool_id,
                    token_id: token_id.to_string(),
                    shares,
                });
            }
        }
    }
    deposits.sort_by_key(|d| d.pool_id);
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
