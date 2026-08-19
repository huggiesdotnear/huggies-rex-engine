//! huggies_rex_get_return_local_fun
//!
//! Local constant-product math for rhea SIMPLE_POOL quotes. Kept in
//! sync with rhea's on-chain `get_return` for SIMPLE_POOL pools
//! (verified via `/api/get_return_compare`).
// =========================================
use anyhow::{Result, anyhow};
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
        // 1 raw into a deep pool should still give > 0 (rounding safety)
        let out =
            huggies_rex_get_return_local_fun("SIMPLE_POOL", 1_000_000, 1_000_000, 1, 30).unwrap();
        assert!(out > 0);
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
    fn debug_pool_3879_at_various_amounts() {
        // pool 3879: wrap.near/usdt, fee 30, reserves 7.73e26 / 1.22e9
        let reserves_in: u128 = 773_072_186_328_860_087_521_503_060;
        let reserves_out: u128 = 1_219_529_020;
        let fee = 30u32;
        // rhea says: 1 NEAR -> 1570751, 0.001 NEAR -> 1572
        for (label, amt) in [("1 NEAR", 10u128.pow(24)), ("0.001 NEAR", 10u128.pow(21))] {
            let out = huggies_rex_get_return_local_fun(
                "SIMPLE_POOL",
                reserves_in,
                reserves_out,
                amt,
                fee,
            )
            .unwrap();
            println!(
                "{label} -> {out} (rhea: {})",
                if label.contains("1 NEAR") && !label.contains("0.001") {
                    1570751
                } else {
                    1572
                }
            );
        }
    }
    #[test]
    fn debug_pool_3838_low_decimals() {
        // pool 3838: wrap.near/elixir.l2e.near, fee 295, reserves 9.17e23 / 6.29e6
        let reserves_in: u128 = 916_575_437_663_692_490_372;
        let reserves_out: u128 = 6_294_493;
        let fee = 295u32;
        for (label, amt) in [("1 NEAR", 10u128.pow(24)), ("0.001 NEAR", 10u128.pow(21))] {
            let out = huggies_rex_get_return_local_fun(
                "SIMPLE_POOL",
                reserves_in,
                reserves_out,
                amt,
                fee,
            )
            .unwrap();
            println!("{label} -> pool 3838 -> {out} (rhea: 6657 for 0.001 NEAR)");
        }
    }
    #[test]
    fn debug_3_hop_001_near() {
        // Hop 1: pool 2758 wrap.near/2260fac5e, 0.001 NEAR in
        let h1 = huggies_rex_get_return_local_fun(
            "SIMPLE_POOL",
            3_829_297_236_791_118_274_223,
            16,
            10u128.pow(21),
            60,
        )
        .unwrap();
        println!("hop 1 out: {}", h1);
        // Hop 2: pool 4176 2260fac5e/token.sweat
        let h2 = huggies_rex_get_return_local_fun(
            "SIMPLE_POOL",
            344,
            716_781_707_606_656_283_764,
            h1,
            120,
        )
        .unwrap();
        println!("hop 2 out: {}", h2);
        // Hop 3: pool 5111 token.sweat/usdt
        let h3 = huggies_rex_get_return_local_fun(
            "SIMPLE_POOL",
            12_071_657_037_708_847_585,
            8912,
            h2,
            300,
        )
        .unwrap();
        println!("hop 3 out: {}", h3);
        // For 0.001 NEAR, direct pool 3879 returns 1572 raw USDT
        // (verified against rhea). The 3-hop path should ALWAYS be
        // smaller because of extra fees + slippage.
        assert!(
            h3 < 1572,
            "3-hop out {} should be < 1-hop out 1572 for 0.001 NEAR",
            h3
        );
    }
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
