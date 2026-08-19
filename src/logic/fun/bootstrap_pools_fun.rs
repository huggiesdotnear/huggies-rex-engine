//! huggies_rex_bootstrap_pools_fun
//!
//! Fetch the full pool list from rhea / ref-finance, paginated using
//! `get_number_of_pools` + `get_pools`, returning every pool record.
// =========================================
use anyhow::{Context, Result};
use chrono::Utc;
use near_kit_tool_box::fun::rhea::rhea_get_number_of_pools_fun_json::get_number_of_pools;
use near_kit_tool_box::fun::rhea::rhea_get_pools_fun_json::get_pools;
use near_kit_tool_box::lib::load_balancer::load_balancing_near::LOAD_BALANCING_NEAR;
use near_kit_tool_box::lib::types::ref_get_pool_type::REF_GET_POOL_TYPE;
use tracing::{info, warn};

use crate::logic::constants::trading_const::POOL_PAGE_LIMIT;
use crate::logic::types::pool_record_type::POOL_RECORD_TYPE;
// =========================================
pub async fn huggies_rex_bootstrap_pools_fun(
    near_view: &LOAD_BALANCING_NEAR,
    rhea_contract_id: &str,
) -> Result<Vec<POOL_RECORD_TYPE>> {
    let total = get_number_of_pools(&near_view.next_near(), rhea_contract_id)
        .await
        .context("get_number_of_pools failed")?;
    info!(total_pools = total, "rhea: get_number_of_pools returned");

    let mut all: Vec<POOL_RECORD_TYPE> = Vec::new();
    let mut from_index: u64 = 0;
    while from_index < total {
        let limit = POOL_PAGE_LIMIT.min(total - from_index);
        match get_pools(&near_view.next_near(), rhea_contract_id, from_index, limit).await {
            Ok(batch) => {
                for (offset, p) in batch.iter().enumerate() {
                    let mut rec = pool_record_from_ref(p);
                    rec.pool_id = from_index + offset as u64;
                    all.push(rec);
                }
            }
            Err(e) => {
                warn!(
                    ?e,
                    from_index, limit, "rhea: get_pools page failed; retrying"
                );
                match get_pools(&near_view.next_near(), rhea_contract_id, from_index, limit).await {
                    Ok(batch) => {
                        for (offset, p) in batch.iter().enumerate() {
                            let mut rec = pool_record_from_ref(p);
                            rec.pool_id = from_index + offset as u64;
                            all.push(rec);
                        }
                    }
                    Err(e2) => {
                        warn!(
                            ?e2,
                            from_index, limit, "rhea: get_pools page failed twice; skipping"
                        );
                    }
                }
            }
        }
        from_index += limit;
    }
    info!(fetched = all.len(), "rhea: bootstrap complete");
    Ok(all)
}
// =========================================
fn pool_record_from_ref(p: &REF_GET_POOL_TYPE) -> POOL_RECORD_TYPE {
    let now_ms = Utc::now().timestamp_millis();
    POOL_RECORD_TYPE {
        pool_id: 0,
        pool_kind: p.pool_kind.clone(),
        token_account_ids: p.token_account_ids.clone(),
        amounts: p.amounts.clone(),
        total_fee: p.total_fee,
        shares_total_supply: p.shares_total_supply.clone(),
        amp: p.amp,
        tvl_usd: None,
        updated_at_unix_ms: now_ms,
    }
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
