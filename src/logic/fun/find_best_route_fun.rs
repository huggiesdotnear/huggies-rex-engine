//! huggies_rex_find_best_route_fun
//!
//! BFS over the in-memory pool graph to find the best swap path from
//! `token_in` to `token_out`, up to `MAX_ROUTE_HOPS` hops, using the
//! local constant-product math. Returns `None` if no route up to that
//! depth produces a non-zero output.
// =========================================
use std::collections::HashMap;

use crate::logic::constants::trading_const::MAX_ROUTE_HOPS;
use crate::logic::fun::get_return_local_fun::huggies_rex_get_return_local_fun;
use crate::logic::types::pool_record_type::POOL_RECORD_TYPE;
use crate::logic::types::route_quote_type::{ROUTE_HOP_TYPE, ROUTE_QUOTE_TYPE, ROUTE_SOURCE_TYPE};
// =========================================
#[derive(Debug, Clone)]
struct ROUTE_NODE {
    pool_id: u64,
    next_token: String,
    amount_out: u128,
}
// =========================================
pub fn huggies_rex_find_best_route_fun(
    pools: &HashMap<u64, POOL_RECORD_TYPE>,
    token_in: &str,
    token_out: &str,
    amount_in: u128,
) -> Option<ROUTE_QUOTE_TYPE> {
    if token_in == token_out {
        return None;
    }
    let mut best: Option<ROUTE_QUOTE_TYPE> = None;

    // frontier holds (current_token, path-of-hops leading to it)
    let mut frontier: Vec<(String, Vec<ROUTE_NODE>)> = vec![(token_in.to_string(), Vec::new())];

    for _depth in 0..MAX_ROUTE_HOPS {
        // For every (token, path), enumerate every SIMPLE_POOL hop
        // and build new candidate paths.
        let mut next_paths: Vec<(String, Vec<ROUTE_NODE>)> = Vec::new();
        for (current_token, path) in frontier {
            for pool in pools.values() {
                if pool.pool_kind != "SIMPLE_POOL" {
                    continue;
                }
                if pool.token_account_ids.len() != 2 || pool.amounts.len() != 2 {
                    continue;
                }
                let (reserve_in_idx, reserve_out_idx, next_token) =
                    if pool.token_account_ids[0] == current_token {
                        (0usize, 1usize, pool.token_account_ids[1].clone())
                    } else if pool.token_account_ids[1] == current_token {
                        (1usize, 0usize, pool.token_account_ids[0].clone())
                    } else {
                        continue;
                    };
                let amount_in_step = if path.is_empty() {
                    amount_in
                } else {
                    path.last().map(|n| n.amount_out).unwrap_or(0)
                };
                let reserves_in = pool.amounts[reserve_in_idx].parse::<u128>().unwrap_or(0);
                let reserves_out = pool.amounts[reserve_out_idx].parse::<u128>().unwrap_or(0);
                let amount_out_step = match huggies_rex_get_return_local_fun(
                    &pool.pool_kind,
                    reserves_in,
                    reserves_out,
                    amount_in_step,
                    pool.total_fee,
                ) {
                    Ok(v) => v,
                    Err(_) => continue,
                };
                if amount_out_step == 0 {
                    continue;
                }
                let mut new_path = path.clone();
                new_path.push(ROUTE_NODE {
                    pool_id: pool.pool_id,
                    next_token: next_token.clone(),
                    amount_out: amount_out_step,
                });
                next_paths.push((next_token.clone(), new_path.clone()));
                if next_token == token_out {
                    let quote = path_to_quote(
                        token_in,
                        token_out,
                        amount_in,
                        path_to_hops(token_in, amount_in, &new_path),
                    );
                    match &best {
                        Some(prev) => {
                            let prev_amt = prev.amount_out.parse::<u128>().unwrap_or(0);
                            let cur_amt = quote.amount_out.parse::<u128>().unwrap_or(0);
                            if cur_amt > prev_amt {
                                best = Some(quote);
                            }
                        }
                        None => best = Some(quote),
                    }
                }
            }
        }
        if next_paths.is_empty() {
            break;
        }
        // Keep only the best path per token at this depth.
        let mut best_per_token: HashMap<String, Vec<ROUTE_NODE>> = HashMap::new();
        for (tok, path) in next_paths {
            let last_out = path.last().map(|n| n.amount_out).unwrap_or(0);
            match best_per_token.get(&tok) {
                Some(existing) => {
                    let existing_out = existing.last().map(|n| n.amount_out).unwrap_or(0);
                    if last_out > existing_out {
                        best_per_token.insert(tok, path);
                    }
                }
                None => {
                    best_per_token.insert(tok, path);
                }
            }
        }
        frontier = best_per_token.into_iter().map(|(k, v)| (k, v)).collect();
    }
    best
}
// =========================================
fn path_to_hops(token_in: &str, amount_in: u128, path: &[ROUTE_NODE]) -> Vec<ROUTE_HOP_TYPE> {
    let mut hops = Vec::with_capacity(path.len());
    let mut prev_token = token_in.to_string();
    let mut running_in = amount_in;
    for node in path {
        hops.push(ROUTE_HOP_TYPE {
            pool_id: node.pool_id,
            token_in: prev_token.clone(),
            token_out: node.next_token.clone(),
            amount_in: running_in.to_string(),
            amount_out: node.amount_out.to_string(),
        });
        prev_token = node.next_token.clone();
        running_in = node.amount_out;
    }
    hops
}
// =========================================
fn path_to_quote(
    token_in: &str,
    token_out: &str,
    amount_in: u128,
    hops: Vec<ROUTE_HOP_TYPE>,
) -> ROUTE_QUOTE_TYPE {
    let amount_out = hops
        .last()
        .map(|h| h.amount_out.clone())
        .unwrap_or_else(|| "0".to_string());
    ROUTE_QUOTE_TYPE {
        token_in: token_in.to_string(),
        token_out: token_out.to_string(),
        amount_in: amount_in.to_string(),
        amount_out,
        hops,
        source: ROUTE_SOURCE_TYPE::Local,
    }
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
