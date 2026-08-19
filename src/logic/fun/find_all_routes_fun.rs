//! huggies_rex_find_all_routes_fun
//!
//! BFS over the in-memory pool graph to enumerate every viable swap
//! path from `token_in` to `token_out`, up to `MAX_ROUTE_HOPS` hops,
//! using the local constant-product math. Routes are deduplicated by
//! pool-id sequence and the list is sorted by `amount_out` descending
//! and capped at `MAX_ROUTES_RETURNED` to keep the swap UI snappy.
// =========================================
use std::collections::{HashMap, HashSet};

use crate::logic::constants::trading_const::MAX_ROUTE_HOPS;
use crate::logic::fun::get_return_local_fun::huggies_rex_get_return_local_fun;
use crate::logic::types::pool_record_type::POOL_RECORD_TYPE;
use crate::logic::types::route_quote_type::{ROUTE_HOP_TYPE, ROUTE_QUOTE_TYPE, ROUTE_SOURCE_TYPE};
// =========================================
const MAX_ROUTES_RETURNED: usize = 12;
// =========================================
#[derive(Debug, Clone)]
pub struct ROUTE_NODE {
    pub pool_id: u64,
    pub next_token: String,
    pub amount_out: u128,
}
// =========================================
pub fn huggies_rex_find_all_routes_fun(
    pools: &HashMap<u64, POOL_RECORD_TYPE>,
    token_in: &str,
    token_out: &str,
    amount_in: u128,
) -> Vec<ROUTE_QUOTE_TYPE> {
    if token_in == token_out || amount_in == 0 {
        return Vec::new();
    }
    // frontier: (current_token, path of ROUTE_NODE)
    let mut frontier: Vec<(String, Vec<ROUTE_NODE>)> = vec![(token_in.to_string(), Vec::new())];
    let mut completed: Vec<Vec<ROUTE_NODE>> = Vec::new();
    let mut seen_route_signatures: HashSet<Vec<u64>> = HashSet::new();

    for _depth in 0..MAX_ROUTE_HOPS {
        let mut next_frontier: Vec<(String, Vec<ROUTE_NODE>)> = Vec::new();
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
                let step_in = if path.is_empty() {
                    amount_in
                } else {
                    path.last().map(|n| n.amount_out).unwrap_or(0)
                };
                let reserves_in = pool.amounts[reserve_in_idx].parse::<u128>().unwrap_or(0);
                let reserves_out = pool.amounts[reserve_out_idx].parse::<u128>().unwrap_or(0);
                let step_out = match huggies_rex_get_return_local_fun(
                    &pool.pool_kind,
                    reserves_in,
                    reserves_out,
                    step_in,
                    pool.total_fee,
                ) {
                    Ok(v) => v,
                    Err(_) => continue,
                };
                if step_out == 0 {
                    continue;
                }
                let mut new_path = path.clone();
                new_path.push(ROUTE_NODE {
                    pool_id: pool.pool_id,
                    next_token: next_token.clone(),
                    amount_out: step_out,
                });
                if next_token == token_out {
                    let sig: Vec<u64> = new_path.iter().map(|n| n.pool_id).collect();
                    if seen_route_signatures.insert(sig) {
                        completed.push(new_path);
                    }
                } else {
                    next_frontier.push((next_token, new_path));
                }
            }
        }
        if next_frontier.is_empty() {
            break;
        }
        frontier = next_frontier;
    }

    // Sort completed routes by final amount_out descending.
    completed.sort_by_key(|p| std::cmp::Reverse(p.last().map(|n| n.amount_out).unwrap_or(0)));
    completed.truncate(MAX_ROUTES_RETURNED);

    completed
        .into_iter()
        .map(|path| path_to_quote(token_in, token_out, amount_in, &path))
        .collect()
}
// =========================================
fn path_to_quote(
    token_in: &str,
    token_out: &str,
    amount_in: u128,
    path: &[ROUTE_NODE],
) -> ROUTE_QUOTE_TYPE {
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
