//! huggies_rex_arb_round_trip_fun
//!
//! Find round-trip arbitrage cycles: start with `amount_in` of `token` and
//! end with as much of the same `token` as possible after a sequence
//! of swaps, up to `max_hops`. Each cycle is a list of pools where
//! each adjacent pair shares a token, and the last pool's `token_out`
//! matches the starting token. When `middle` is set, we restrict to
//! exactly 2 hops going through that middle token.
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
    middle: Option<&str>,
) -> Vec<ARB_CYCLE_TYPE> {
    if amount_in == 0 || start_token.is_empty() || max_hops == 0 {
        return Vec::new();
    }
    tracing::info!(
        start = start_token,
        amount = amount_in,
        max_hops,
        max_cycles,
        pool_count = pools.len(),
        "BFS start"
    );
    if let Some(mid) = middle {
        // Fixed 2-hop round trip through `mid`: start -> mid -> start.
        // Pick the best pool for each leg independently so the user
        // sees the most profitable combination.
        return arb_via_middle(pools, start_token, mid, amount_in, max_cycles);
    }
    // state: (current_token, current_amount, path_of_(pool_id, next_token, amount_out))
    let mut best: Vec<ARB_CYCLE_TYPE> = Vec::new();
    let initial: Vec<(String, u128, Vec<(u64, String, u128)>)> =
        vec![(start_token.to_string(), amount_in, Vec::new())];
    let mut frontier: Vec<(String, u128, Vec<(u64, String, u128)>)> = initial;

    for _depth in 0..max_hops {
        let mut next: Vec<(String, u128, Vec<(u64, String, u128)>)> = Vec::new();
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
                    tracing::debug!(pool_id = pool.pool_id, step_out, "BFS cycle completed");
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
        b.profit_bps
            .partial_cmp(&a.profit_bps)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    best
}
// =========================================
/// Fixed 2-hop round trip: start -> middle -> start. For each leg we
/// enumerate every SIMPLE_POOL that contains the right pair and pick
/// the combination that produces the highest `amount_out` of the
/// start token after both swaps.
fn arb_via_middle(
    pools: &std::collections::HashMap<u64, POOL_RECORD_TYPE>,
    start_token: &str,
    middle: &str,
    amount_in: u128,
    max_cycles: usize,
) -> Vec<ARB_CYCLE_TYPE> {
    if start_token == middle {
        return Vec::new();
    }
    // leg 1 candidates: every pool that contains start_token + middle
    let leg1: Vec<&POOL_RECORD_TYPE> = pools
        .values()
        .filter(|p| {
            p.pool_kind == "SIMPLE_POOL"
                && p.token_account_ids.len() == 2
                && p.token_account_ids.contains(&start_token.to_string())
                && p.token_account_ids.contains(&middle.to_string())
        })
        .collect();
    // leg 2 candidates: every pool that contains middle + start
    let leg2: Vec<&POOL_RECORD_TYPE> = pools
        .values()
        .filter(|p| {
            p.pool_kind == "SIMPLE_POOL"
                && p.token_account_ids.len() == 2
                && p.token_account_ids.contains(&middle.to_string())
                && p.token_account_ids.contains(&start_token.to_string())
        })
        .collect();
    if leg1.is_empty() || leg2.is_empty() {
        return Vec::new();
    }
    let mut results: Vec<ARB_CYCLE_TYPE> = Vec::new();
    for p1 in &leg1 {
        let (r1_in, r1_out) = if p1.token_account_ids[0] == start_token {
            (0usize, 1usize)
        } else {
            (1usize, 0usize)
        };
        let reserves1_in = p1.amounts[r1_in].parse::<u128>().unwrap_or(0);
        let reserves1_out = p1.amounts[r1_out].parse::<u128>().unwrap_or(0);
        let mid_amount = match huggies_rex_get_return_local_fun(
            &p1.pool_kind,
            reserves1_in,
            reserves1_out,
            amount_in,
            p1.total_fee,
        ) {
            Ok(v) if v > 0 => v,
            _ => continue,
        };
        for p2 in &leg2 {
            if p2.pool_id == p1.pool_id {
                continue;
            }
            let (r2_in, r2_out) = if p2.token_account_ids[0] == middle {
                (0usize, 1usize)
            } else {
                (1usize, 0usize)
            };
            let reserves2_in = p2.amounts[r2_in].parse::<u128>().unwrap_or(0);
            let reserves2_out = p2.amounts[r2_out].parse::<u128>().unwrap_or(0);
            let final_amount = match huggies_rex_get_return_local_fun(
                &p2.pool_kind,
                reserves2_in,
                reserves2_out,
                mid_amount,
                p2.total_fee,
            ) {
                Ok(v) if v > 0 => v,
                _ => continue,
            };
            let profit_i = (final_amount as i128) - (amount_in as i128);
            let profit_bps = (profit_i as f64) * 10_000.0 / (amount_in.max(1) as f64);
            let profit_str = if profit_i >= 0 {
                format!("+{profit_i}")
            } else {
                profit_i.to_string()
            };
            let hops = vec![
                ROUTE_HOP_TYPE {
                    pool_id: p1.pool_id,
                    token_in: start_token.to_string(),
                    token_out: middle.to_string(),
                    amount_in: crate::logic::types::token_amount_type::TOKEN_AMOUNT_TYPE::new(
                        amount_in.to_string(),
                        None,
                        None,
                    ),
                    amount_out: crate::logic::types::token_amount_type::TOKEN_AMOUNT_TYPE::new(
                        mid_amount.to_string(),
                        None,
                        None,
                    ),
                },
                ROUTE_HOP_TYPE {
                    pool_id: p2.pool_id,
                    token_in: middle.to_string(),
                    token_out: start_token.to_string(),
                    amount_in: crate::logic::types::token_amount_type::TOKEN_AMOUNT_TYPE::new(
                        mid_amount.to_string(),
                        None,
                        None,
                    ),
                    amount_out: crate::logic::types::token_amount_type::TOKEN_AMOUNT_TYPE::new(
                        final_amount.to_string(),
                        None,
                        None,
                    ),
                },
            ];
            // The decimals for amount_in / amount_out are filled in by
            // the route builder (find_all_routes_fun) using the
            // in-memory token map. For round-trip via middle, the
            // caller's known decimals can be plugged in by the route
            // handler.
            results.push(ARB_CYCLE_TYPE {
                start_token: start_token.to_string(),
                amount_in: amount_in.to_string(),
                amount_out: final_amount.to_string(),
                profit: profit_str,
                profit_bps,
                hops,
                path: vec![p1.pool_id, p2.pool_id],
            });
        }
    }
    results.sort_by(|a, b| {
        b.profit_bps
            .partial_cmp(&a.profit_bps)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    results.truncate(max_cycles);
    results
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
            amount_in: crate::logic::types::token_amount_type::TOKEN_AMOUNT_TYPE::new(
                running_in.to_string(),
                None,
                None,
            ),
            amount_out: crate::logic::types::token_amount_type::TOKEN_AMOUNT_TYPE::new(
                amount_out.to_string(),
                None,
                None,
            ),
        });
        prev_token = next_token.clone();
        running_in = *amount_out;
        if i == 0 {
            // subsequent hops need the original amount; we patch below
        }
    }
    // patch first hop's amount_in to "" (caller fills via cycle.amount_in)
    if let Some(first) = hops.first_mut() {
        first.amount_in.raw.clear();
    }
    hops
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
