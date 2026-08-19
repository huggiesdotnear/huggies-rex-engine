//! huggies_rex_get_return_local_fun
//!
//! Local constant-product math for rhea SIMPLE_POOL quotes. Uses
//! `num_bigint::BigUint` for the intermediate products so we don't
//! overflow `u128` (which happens for very deep pools — e.g. pool
//! #5090 has a 6.2e28 reserve, and 1e22 input × 6.2e28 = 6.2e50
//! overflows u128 ≈ 3.4e38). The result is clamped to `u128` on
//! return.
// =========================================
use anyhow::{Result, anyhow};
use num_bigint::BigUint;
// =========================================
/// Quote `amount_in` of `token_in` -> `token_out` using the standard
/// ref-finance constant-product formula with the given `total_fee_bps`
/// in basis points (100 bps = 1%).
///
/// Formula:
///   amount_in_with_fee = amount_in * (10_000 - fee_bps)
///   amount_out = amount_in_with_fee * reserve_out
///              / (10_000 * reserve_in + amount_in_with_fee)
///
/// Only SIMPLE_POOL is supported. Returns Err for other pool kinds.
/// Uses `BigUint` for the intermediate products so deep pools don't
/// overflow `u128`; the result is clamped to `u128` on return.
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
    let ten_k = BigUint::from(10_000u128);
    let amount_in_with_fee = BigUint::from(amount_in) * (ten_k.clone() - BigUint::from(fee_bps));
    let reserves_in_big = BigUint::from(reserves_in);
    let reserves_out_big = BigUint::from(reserves_out);
    let numerator = amount_in_with_fee.clone() * reserves_out_big.clone();
    let denominator = reserves_in_big * ten_k + amount_in_with_fee;
    let amount_out_big = numerator / denominator;
    // clamp to u128 (rounds down). amounts this large are unlikely
    // in practice but we don't want to silently truncate to 0.
    let amount_out: u128 = amount_out_big
        .try_into()
        .map_err(|_| anyhow!("amount_out exceeds u128"))?;
    Ok(amount_out)
}
// =========================================
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn zero_reserve() {
        let r = huggies_rex_get_return_local_fun("SIMPLE_POOL", 0, 100, 1000, 30);
        assert!(r.is_err());
    }
    #[test]
    fn only_simple_pool_supported() {
        let r = huggies_rex_get_return_local_fun("STABLE_SWAP_POOL", 100, 100, 1000, 30);
        assert!(r.is_err());
    }
    #[test]
    fn small_input_rounds_to_zero() {
        // 1 raw into a deep pool: the integer division rounds to 0
        // for amount_in=1 vs reserves=1_000_000. The function returns Ok(0).
        let out =
            huggies_rex_get_return_local_fun("SIMPLE_POOL", 1_000_000, 1_000_000, 1, 30).unwrap();
        assert_eq!(out, 0);
    }
    #[test]
    fn large_input_no_overflow() {
        // 1e24 input into 1e24 reserves, 30 bps fee
        let out = huggies_rex_get_return_local_fun(
            "SIMPLE_POOL",
            10u128.pow(24),
            10u128.pow(24),
            10u128.pow(24),
            30,
        )
        .unwrap();
        // Output should be slightly less than input due to slippage
        assert!(out > 0);
    }
    #[test]
    fn no_overflow_on_deep_pools() {
        // Reproduces the bug: 1e22 input × 6.2e28 reserve overflows
        // u128 (≈3.4e38) if you do naive 128-bit math. With BigUint
        // this should return a non-zero output.
        let out = huggies_rex_get_return_local_fun(
            "SIMPLE_POOL",
            62_100_872_846_043_217_261_158_787, // 6.21e28 (reserves_in)
            14_757_936_069_989,                 // 1.48e13 (reserves_out)
            10_000_000_000_000_000_000_000,     // 1e22
            220,                                // fee_bps
        )
        .unwrap();
        assert!(out > 0);
    }
    #[test]
    fn parity_with_rhea_1_near_to_usdt() {
        // pool 3879: 7.73e26 / 1.22e9, fee 30, input 1 NEAR
        // rhea says: 1_570_751 raw usdt
        let out = huggies_rex_get_return_local_fun(
            "SIMPLE_POOL",
            773_072_186_328_860_087_521_503_060,
            1_219_529_020,
            10u128.pow(24),
            30,
        )
        .unwrap();
        // exact rhea value: 1_570_751. allow ±1 for rounding.
        assert!((out as i128 - 1_570_751i128).abs() <= 1, "got {out}");
    }
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
