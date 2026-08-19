//! huggies_rex_bootstrap_state_fun
//!
//! Boot sequence: fetch all pools, reconcile token metadata from
//! price-indexer, populate the sqlite cache, then spawn three WS
//! subscriber tasks that keep the state fresh.
// =========================================
use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context, Result};
use chrono::Utc;
use dashmap::DashMap;
use near_kit_tool_box::lib::client_kit::NEAR_KIT_CLIENT;
use reqwest::Client as HttpClient;
use tokio::sync::Mutex;
use tokio::sync::broadcast;
use tracing::{error, info, warn};

use crate::logic::constants::network_const::{HTTP_CLIENT_TIMEOUT_SECS, NETWORK_CONST_TYPE};
use crate::logic::constants::rhea_contract_id_const::RHEA_CONTRACT_ID;
use crate::logic::constants::vault_const::VAULT_CONST_TYPE;
use crate::logic::fun::apply_trade_pool_change_fun::huggies_rex_apply_trade_pool_change_fun;
use crate::logic::fun::apply_trade_pool_fun::huggies_rex_apply_trade_pool_fun;
use crate::logic::fun::bootstrap_pools_fun::huggies_rex_bootstrap_pools_fun;
use crate::logic::fun::cache_pool_upsert_fun::huggies_rex_cache_pool_upsert_fun;
use crate::logic::fun::cache_sqlite_open_fun::huggies_rex_cache_sqlite_open_fun;
use crate::logic::fun::cache_token_upsert_fun::huggies_rex_cache_token_upsert_fun;
use crate::logic::fun::events_ws_run_fun::huggies_rex_events_ws_run_fun;
use crate::logic::fun::price_indexer_list_token_price_fun::huggies_rex_price_indexer_list_token_price_fun;
use crate::logic::fun::price_indexer_refresh_fun::huggies_rex_price_indexer_refresh_fun;
use crate::logic::fun::vault_dir_fun::huggies_rex_vault_dir_fun;
use crate::logic::types::app_state_type::{APP_STATE_TYPE, EVENT_BROADCAST_TYPE, SharedAppState};
use crate::logic::types::pool_record_type::POOL_RECORD_TYPE;
use crate::logic::types::token_record_type::TOKEN_RECORD_TYPE;
// =========================================
pub async fn huggies_rex_bootstrap_state_fun(
    vault_dir: &str,
    signer_account_id: &str,
) -> Result<SharedAppState> {
    let _ = signer_account_id;
    let vault_path = huggies_rex_vault_dir_fun(vault_dir);
    let db_path = vault_path.join(VAULT_CONST_TYPE.db_file_name);
    let conn =
        huggies_rex_cache_sqlite_open_fun(&db_path).context("failed to open sqlite cache")?;
    let near_view = NEAR_KIT_CLIENT::view_balancer_mainnet();
    let rhea_contract_id = RHEA_CONTRACT_ID.to_string();

    let pools_map: DashMap<u64, POOL_RECORD_TYPE> = DashMap::new();
    let tokens_map: DashMap<String, TOKEN_RECORD_TYPE> = DashMap::new();
    let (event_tx, _rx) = broadcast::channel::<EVENT_BROADCAST_TYPE>(1024);
    let state = Arc::new(APP_STATE_TYPE {
        near_view,
        rhea_contract_id: rhea_contract_id.clone(),
        pools: pools_map,
        tokens: tokens_map,
        sqlite: Mutex::new(conn),
        vault_dir: vault_path.to_string_lossy().to_string(),
        event_tx,
    });

    // Initial pool fetch.
    match huggies_rex_bootstrap_pools_fun(&state.near_view, &rhea_contract_id).await {
        Ok(pools) => {
            info!(count = pools.len(), "bootstrap: pools fetched");
            {
                let guard = state.sqlite.lock().await;
                for p in &pools {
                    let _ = huggies_rex_cache_pool_upsert_fun(&guard, p);
                }
            }
            for p in pools {
                state.pools.insert(p.pool_id, p);
            }
        }
        Err(e) => {
            warn!(?e, "bootstrap: get_pools failed; starting with empty state");
        }
    }

    // Token reconciliation with price-indexer.
    let http = HttpClient::builder()
        .timeout(Duration::from_secs(HTTP_CLIENT_TIMEOUT_SECS))
        .build()
        .context("failed to build http client")?;
    match huggies_rex_price_indexer_list_token_price_fun(
        &http,
        NETWORK_CONST_TYPE.price_indexer_base_url,
    )
    .await
    {
        Ok(map) => {
            info!(count = map.len(), "bootstrap: token metadata fetched");
            let mut all_tokens: Vec<TOKEN_RECORD_TYPE> = Vec::new();
            for token in map.into_values() {
                all_tokens.push(token.clone());
                state.tokens.insert(token.account_id.clone(), token);
            }
            {
                let guard = state.sqlite.lock().await;
                for t in &all_tokens {
                    let _ = huggies_rex_cache_token_upsert_fun(&guard, t);
                }
            }
        }
        Err(e) => {
            warn!(?e, "bootstrap: price-indexer reconciliation failed");
        }
    }

    // Spawn event subscribers.
    let state_trade_pool = state.clone();
    tokio::spawn(async move {
        let base = NETWORK_CONST_TYPE.events_ws_base_url;
        let path = crate::logic::constants::events_const::TRADE_POOL_EVENT_PATH;
        let label = "trade_pool";
        huggies_rex_events_ws_run_fun(base, path, label, move |raw| {
            let s = state_trade_pool.clone();
            tokio::spawn(async move {
                huggies_rex_apply_trade_pool_fun(&s, raw).await;
                let _ = s.event_tx.send(EVENT_BROADCAST_TYPE::Heartbeat {
                    ts_unix_ms: Utc::now().timestamp_millis(),
                });
            });
        })
        .await;
    });

    let state_pool_change = state.clone();
    tokio::spawn(async move {
        let base = NETWORK_CONST_TYPE.events_ws_base_url;
        let path = crate::logic::constants::events_const::TRADE_POOL_CHANGE_EVENT_PATH;
        let label = "trade_pool_change";
        huggies_rex_events_ws_run_fun(base, path, label, move |raw| {
            let s = state_pool_change.clone();
            tokio::spawn(async move {
                huggies_rex_apply_trade_pool_change_fun(&s, raw).await;
                let _ = s.event_tx.send(EVENT_BROADCAST_TYPE::Heartbeat {
                    ts_unix_ms: Utc::now().timestamp_millis(),
                });
            });
        })
        .await;
    });

    let state_swap = state.clone();
    tokio::spawn(async move {
        let base = NETWORK_CONST_TYPE.events_ws_base_url;
        let path = crate::logic::constants::events_const::TRADE_SWAP_EVENT_PATH;
        let label = "trade_swap";
        huggies_rex_events_ws_run_fun(base, path, label, move |_raw| {
            let _ = state_swap.event_tx.send(EVENT_BROADCAST_TYPE::Heartbeat {
                ts_unix_ms: Utc::now().timestamp_millis(),
            });
        })
        .await;
    });

    // Heartbeat task.
    let state_hb = state.clone();
    tokio::spawn(async move {
        let mut ticker = tokio::time::interval(Duration::from_secs(5));
        loop {
            ticker.tick().await;
            let _ = state_hb.event_tx.send(EVENT_BROADCAST_TYPE::Heartbeat {
                ts_unix_ms: Utc::now().timestamp_millis(),
            });
        }
    });

    // Price-indexer refresh task (every 5m by default).
    let state_px = state.clone();
    let http_px = http.clone();
    let base_px = NETWORK_CONST_TYPE.price_indexer_base_url.to_string();
    tokio::spawn(async move {
        huggies_rex_price_indexer_refresh_fun(state_px, http_px, base_px).await;
    });

    Ok(state)
}
// =========================================
pub async fn huggies_rex_run_server_fun(state: SharedAppState, bind: &str) -> Result<()> {
    let app = crate::logic::fun::router_fun::huggies_rex_router_fun(state);
    let listener = tokio::net::TcpListener::bind(bind)
        .await
        .with_context(|| format!("failed to bind to {bind}"))?;
    info!(%bind, "huggies-rex: serving");
    if let Err(e) = axum::serve(listener, app).await {
        error!(?e, "huggies-rex: axum::serve error");
    }
    Ok(())
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
