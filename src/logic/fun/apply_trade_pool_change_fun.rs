//! huggies_rex_apply_trade_pool_change_fun
//!
//! Apply a `trade_pool_change` event to in-memory + sqlite pool state.
//! For `SimplePool` (the only kind we support in the local
//! `get_return` math), we overwrite `amounts`, `total_fee`, and
//! `shares_total_supply`.
// =========================================
use chrono::Utc;
use tracing::warn;

use crate::logic::fun::events_ws_handler_fun::{
    POOL_TYPE_WRAPPER_TYPE, REF_POOL_CHANGE_TYPE, TRADE_POOL_CHANGE_EVENT_TYPE,
};
use crate::logic::types::app_state_type::APP_STATE_TYPE;
use crate::logic::types::pool_record_type::POOL_RECORD_TYPE;
// =========================================
fn parse_pool_id_string(raw: &str) -> Option<u64> {
    let trimmed = raw
        .strip_prefix("REF-")
        .or_else(|| raw.strip_prefix("ref-"))
        .unwrap_or(raw);
    trimmed.parse::<u64>().ok()
}
// =========================================
pub async fn huggies_rex_apply_trade_pool_change_fun(
    state: &APP_STATE_TYPE,
    raw: serde_json::Value,
) -> Option<crate::logic::types::app_state_type::EVENT_BROADCAST_TYPE> {
    use crate::logic::types::app_state_type::EVENT_BROADCAST_TYPE;
    let event: TRADE_POOL_CHANGE_EVENT_TYPE = match serde_json::from_value(raw) {
        Ok(e) => e,
        Err(e) => {
            warn!(?e, "trade_pool_change: failed to deserialize event");
            return None;
        }
    };
    let Some(pool_id) = parse_pool_id_string(&event.pool_id) else {
        warn!(pool_id = %event.pool_id, "trade_pool_change: could not parse pool_id");
        return None;
    };
    let pool_kind: String;
    let token_account_ids: Vec<String>;
    let amounts: Vec<String>;
    let total_fee: u32;
    let shares_total_supply: String;
    let amp: u64;
    let ref_pool = match event.pool {
        POOL_TYPE_WRAPPER_TYPE::Ref(r) => r,
        _ => return None,
    };
    match ref_pool {
        REF_POOL_CHANGE_TYPE::SimplePool(p) => {
            pool_kind = "SIMPLE_POOL".to_string();
            token_account_ids = p.token_account_ids;
            amounts = p.amounts.iter().map(|v| v.to_string()).collect();
            total_fee = p.total_fee;
            shares_total_supply = p.shares_total_supply.to_string();
            amp = 0;
        }
        REF_POOL_CHANGE_TYPE::StableSwapPool {
            token_account_ids: t,
            token_decimals: _,
            c_amounts,
            total_fee: tf,
        } => {
            pool_kind = "STABLE_SWAP_POOL".to_string();
            token_account_ids = t;
            amounts = c_amounts.iter().map(|v| v.to_string()).collect();
            total_fee = tf;
            shares_total_supply = "0".to_string();
            amp = 0;
        }
        REF_POOL_CHANGE_TYPE::RatedSwapPool {
            token_account_ids: t,
            token_decimals: _,
            c_amounts,
            total_fee: tf,
        } => {
            pool_kind = "RATED_SWAP_POOL".to_string();
            token_account_ids = t;
            amounts = c_amounts.iter().map(|v| v.to_string()).collect();
            total_fee = tf;
            shares_total_supply = "0".to_string();
            amp = 0;
        }
        REF_POOL_CHANGE_TYPE::DegenSwapPool {
            token_account_ids: t,
            token_decimals: _,
            c_amounts,
            total_fee: tf,
        } => {
            pool_kind = "DEGEN_SWAP_POOL".to_string();
            token_account_ids = t;
            amounts = c_amounts.iter().map(|v| v.to_string()).collect();
            total_fee = tf;
            shares_total_supply = "0".to_string();
            amp = 0;
        }
    }
    let updated_at = Utc::now().timestamp_millis();
    let record = POOL_RECORD_TYPE {
        pool_id,
        pool_kind: pool_kind.clone(),
        token_account_ids: token_account_ids.clone(),
        amounts: amounts.clone(),
        total_fee,
        shares_total_supply,
        amp,
        tvl_usd: None,
        updated_at_unix_ms: updated_at,
    };
    state.pools.insert(pool_id, record.clone());
    {
        let guard = state.sqlite.lock().await;
        let _ = crate::logic::fun::cache_pool_upsert_fun::huggies_rex_cache_pool_upsert_fun(
            &guard, &record,
        );
    }
    for token_id in &token_account_ids {
        let new_token = crate::logic::types::token_record_type::TOKEN_RECORD_TYPE {
            account_id: token_id.clone(),
            symbol: token_id
                .split('.')
                .next()
                .unwrap_or(token_id)
                .to_uppercase(),
            name: token_id.clone(),
            decimals: 24,
            icon: None,
            price_usd: None,
            updated_at_unix_ms: updated_at,
        };
        state.tokens.entry(token_id.clone()).or_insert(new_token);
    }
    let ts_unix_ms = (event.block_timestamp_nanosec / 1_000_000) as i64;
    Some(EVENT_BROADCAST_TYPE::TradePoolChange {
        pool_id: event.pool_id,
        pool_kind,
        token_account_ids,
        amounts,
        total_fee,
        ts_unix_ms,
    })
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
