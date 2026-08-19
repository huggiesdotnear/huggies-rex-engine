//! huggies_rex_get_return_local_fun
//!
//! Constant-product local quote for `SIMPLE_POOL`. For any other pool
//! kind we return `None` so the caller falls back to the on-chain RPC.
// =========================================
use anyhow::{Result, anyhow};
// =========================================
pub fn huggies_rex_get_return_local_fun(
    pool_kind: &str,
    reserves_in: u128,
    reserves_out: u128,
    amount_in: u128,
    total_fee_bps: u32,
) -> Result<u128> {
    if pool_kind != "SIMPLE_POOL" {
        return Err(anyhow!(
            "local get_return only supports SIMPLE_POOL; got {pool_kind}"
        ));
    }
    if reserves_in == 0 || reserves_out == 0 {
        return Err(anyhow!("pool has zero reserve"));
    }
    if amount_in == 0 {
        return Err(anyhow!("amount_in must be > 0"));
    }
    let fee_bps = total_fee_bps.min(10_000) as u128;
    let amount_in_with_fee = amount_in
        .checked_mul(10_000u128.checked_sub(fee_bps).unwrap_or(0))
        .ok_or_else(|| anyhow!("amount_in * fee mul overflow"))?;
    let numerator = amount_in_with_fee
        .checked_mul(reserves_out)
        .ok_or_else(|| anyhow!("numerator overflow"))?;
    let denominator = reserves_in
        .checked_mul(10_000u128)
        .and_then(|v| v.checked_add(amount_in_with_fee))
        .ok_or_else(|| anyhow!("denominator overflow"))?;
    let amount_out = numerator / denominator;
    Ok(amount_out)
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
