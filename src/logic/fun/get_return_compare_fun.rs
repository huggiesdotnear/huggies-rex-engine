//! huggies_rex_get_return_compare_fun
//!
//! Compare our local constant-product get_return math against the
//! real rhea `get_return` RPC call for the same pool/amount/tokens.
//! Used by `/api/get_return_compare` and as a runtime sanity check.
// =========================================
use anyhow::{Result, anyhow};
use near_kit::Near;
use near_kit_tool_box::fun::rhea::rhea_get_return_fun_json::get_return as rhea_get_return;

use crate::logic::fun::get_return_local_fun::huggies_rex_get_return_local_fun;
// =========================================
#[derive(Debug, Clone, serde::Serialize)]
pub struct GET_RETURN_COMPARE_TYPE {
    pub pool_id: u64,
    pub token_in: String,
    pub token_out: String,
    pub amount_in: String,
    pub local: String,
    pub rpc: String,
    pub diff_abs: String,
    pub diff_bps: f64,
    pub match_: bool,
}
// =========================================
pub async fn huggies_rex_get_return_compare_fun(
    near: &Near,
    rhea_contract_id: &str,
    pool_id: u64,
    pool_kind: &str,
    reserve_in: &str,
    reserve_out: &str,
    total_fee_bps: u32,
    token_in: &str,
    token_out: &str,
    amount_in: &str,
) -> Result<GET_RETURN_COMPARE_TYPE> {
    let amount_in_u128: u128 = amount_in
        .parse()
        .map_err(|e| anyhow!("invalid amount_in: {e}"))?;
    let reserve_in_u: u128 = reserve_in.parse().unwrap_or(0);
    let reserve_out_u: u128 = reserve_out.parse().unwrap_or(0);
    let local_u = match huggies_rex_get_return_local_fun(
        pool_kind,
        reserve_in_u,
        reserve_out_u,
        amount_in_u128,
        total_fee_bps,
    ) {
        Ok(v) => v,
        Err(e) => return Err(anyhow!("local math failed: {e}")),
    };
    let rpc_out = rhea_get_return(
        near,
        rhea_contract_id,
        pool_id as u32,
        token_in,
        amount_in,
        token_out,
    )
    .await
    .map_err(|e| anyhow!("rhea get_return failed: {e}"))?;
    let rpc_u: u128 = rpc_out.parse().unwrap_or(0);
    let diff_abs = if local_u >= rpc_u {
        local_u - rpc_u
    } else {
        rpc_u - local_u
    };
    let basis = rpc_u.max(1);
    let diff_bps = (diff_abs as f64) * 10_000.0 / (basis as f64);
    Ok(GET_RETURN_COMPARE_TYPE {
        pool_id,
        token_in: token_in.to_string(),
        token_out: token_out.to_string(),
        amount_in: amount_in.to_string(),
        local: local_u.to_string(),
        rpc: rpc_out,
        diff_abs: diff_abs.to_string(),
        diff_bps,
        match_: diff_bps < 1.0,
    })
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
