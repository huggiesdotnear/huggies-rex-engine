//! huggies_rex_arb_round_trip_fun
//!
//! Find round-trip arbitrage cycles: start with `amount_in` of `token` and
//! end with as much of the same `token` as possible after a sequence
//! of swaps, up to `max_hops`. Each cycle is a list of pools where
//! each adjacent pair shares a token, and the last pool's `token_out`
//! matches the starting token.
// =========================================
use std::collections::HashSet;

use crate::logic::fun::get_return_local_fun::huggies_rex_get_return_local_fun;
use crate::logic::types::pool_record_type::POOL_RECORD_TYPE;
use crate::logic::types::route_quote_type::{ROUTE_HOP_TYPE, ROUTE_QUOTE_TYPE, ROUTE_SOURCE_TYPE};
// =========================================
#[derive(Debug, Clone, serde::Serialize)]
pub struct ARB_CYCLE_TYPE {
    pub start_token: String,
    pub amount_in: String,
    pub amount_out: String,
    /// signed profit (positive = gain, negative = loss) in `start_token`
    /// units.
    pub profit: String,
    /// signed profit in basis points (1 bps = 0.01%). Positive = gain.
    pub profit_bps: f64,
    pub hops: Vec<ROUTE_HOP_TYPE>,
    pub path: Vec<u64>,
}
// =========================================
pub fn huggies_rex_arb_round_trip_fun(
    pools: &std::collections::HashMap<u64, POOL_RECORD_TYPE>,
    start_token: &str,
    amount_in: u128,
    max_hops: usize,
    max_cycles: usize,
) -> Vec<ARB_CYCLE_TYPE> {
    if amount_in == 0 || start_token.is_empty() || max_hops == 0 {
        return Vec::new();
    }
    // state: (current_token, current_amount, path_of_(pool_id, next_token, amount_out))
    let mut best: Vec<ARB_CYCLE_TYPE> = Vec::new();
    let initial: Vec<(String, u128, Vec<(u64, String, u128)>)> =
        vec![(start_token.to_string(), amount_in, Vec::new())];
    let mut frontier: Vec<(String, u128, Vec<(u64, String, u128)>)> = initial;

    for _depth in 0..max_hops {
        let mut next: Vec<(String, u128, Vec<(u64, String, u128)>)> = Vec::new();
        let mut seen_pools: HashSet<u64> = HashSet::new();
        for (current_token, current_amount, path) in frontier.iter() {
            for pool in pools.values() {
                if pool.pool_kind != "SIMPLE_POOL" {
                    continue;
                }
                if pool.token_account_ids.len() != 2 || pool.amounts.len() != 2 {
                    continue;
                }
                if path.iter().any(|(pid, _, _)| pid == &pool.pool_id) {
                    continue;
                }
                let (r_in, r_out, next_token) = if pool.token_account_ids[0] == *current_token {
                    (0usize, 1usize, pool.token_account_ids[1].clone())
                } else if pool.token_account_ids[1] == *current_token {
                    (1usize, 0usize, pool.token_account_ids[0].clone())
                } else {
                    continue;
                };
                let reserves_in = pool.amounts[r_in].parse::<u128>().unwrap_or(0);
                let reserves_out = pool.amounts[r_out].parse::<u128>().unwrap_or(0);
                let step_out = match huggies_rex_get_return_local_fun(
                    &pool.pool_kind,
                    reserves_in,
                    reserves_out,
                    *current_amount,
                    pool.total_fee,
                ) {
                    Ok(v) if v > 0 => v,
                    _ => continue,
                };
                let mut new_path = path.clone();
                new_path.push((pool.pool_id, next_token.clone(), step_out));
                if next_token == start_token {
                    // completed cycle
                    let profit_i = (step_out as i128) - (amount_in as i128);
                    let profit_bps = (profit_i as f64) * 10_000.0 / (amount_in.max(1) as f64);
                    let profit_str = if profit_i >= 0 {
                        format!("+{profit_i}")
                    } else {
                        profit_i.to_string()
                    };
                    let cycle = ARB_CYCLE_TYPE {
                        start_token: start_token.to_string(),
                        amount_in: amount_in.to_string(),
                        amount_out: step_out.to_string(),
                        profit: profit_str,
                        profit_bps,
                        hops: cycle_to_hops(start_token, &new_path),
                        path: new_path.iter().map(|(p, _, _)| *p).collect(),
                    };
                    best.push(cycle);
                    if best.len() >= max_cycles {
                        break;
                    }
                } else {
                    next.push((next_token, step_out, new_path));
                    seen_pools.insert(pool.pool_id);
                }
            }
            if best.len() >= max_cycles {
                break;
            }
        }
        if next.is_empty() {
            break;
        }
        frontier = next;
    }
    best.sort_by(|a, b| {
        b.profit
            .parse::<u128>()
            .unwrap_or(0)
            .cmp(&a.profit.parse::<u128>().unwrap_or(0))
    });
    best
}
// =========================================
fn cycle_to_hops(start_token: &str, path: &[(u64, String, u128)]) -> Vec<ROUTE_HOP_TYPE> {
    let mut hops = Vec::with_capacity(path.len());
    let mut prev_token = start_token.to_string();
    let mut running_in: u128 = path.first().map(|_| 0).unwrap_or(0);
    // first hop's amount_in is the start amount; we need it from caller
    // — we accept that the first hop shows 0 in `amount_in` here and
    // let the front-end re-derive it from the cycle's `amount_in`.
    for (i, (pool_id, next_token, amount_out)) in path.iter().enumerate() {
        hops.push(ROUTE_HOP_TYPE {
            pool_id: *pool_id,
            token_in: prev_token.clone(),
            token_out: next_token.clone(),
            amount_in: running_in.to_string(),
            amount_out: amount_out.to_string(),
        });
        prev_token = next_token.clone();
        running_in = *amount_out;
        if i == 0 {
            // subsequent hops need the original amount; we patch below
        }
    }
    // patch first hop's amount_in to "" (caller fills via cycle.amount_in)
    if let Some(first) = hops.first_mut() {
        first.amount_in.clear();
    }
    hops
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
