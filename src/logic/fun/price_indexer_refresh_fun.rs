//! huggies_rex_price_indexer_refresh_fun
//!
//! Background task that periodically pulls `/list-token-price` from
//! the intear price indexer and reconciles our token metadata cache
//! (price + symbol + decimals). Defaults to every 5 minutes; override
//! with `HUGGIES_REX_PRICE_REFRESH_SECS`.
// =========================================
use std::time::Duration;

use anyhow::Result;
use chrono::Utc;
use reqwest::Client;
use tokio::time::interval;
use tracing::{info, warn};

use crate::logic::fun::price_indexer_list_token_price_fun::huggies_rex_price_indexer_list_token_price_fun;
use crate::logic::types::app_state_type::APP_STATE_TYPE;
// =========================================
pub async fn huggies_rex_price_indexer_refresh_fun(
    state: std::sync::Arc<APP_STATE_TYPE>,
    http: Client,
    base_url: String,
) {
    let period = Duration::from_secs(
        std::env::var("HUGGIES_REX_PRICE_REFRESH_SECS")
            .ok()
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(300),
    );
    let mut ticker = interval(period);
    ticker.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);
    loop {
        ticker.tick().await;
        match huggies_rex_price_indexer_list_token_price_fun(&http, &base_url).await {
            Ok(map) => {
                let now = Utc::now().timestamp_millis();
                let mut updated = 0;
                for (account_id, token) in map {
                    let mut entry = state.tokens.entry(account_id).or_insert(token.clone());
                    entry.symbol = token.symbol;
                    entry.name = token.name;
                    entry.decimals = token.decimals;
                    entry.icon = token.icon;
                    entry.price_usd = token.price_usd;
                    entry.updated_at_unix_ms = now;
                    updated += 1;
                }
                info!(updated, "price-indexer: refresh complete");
            }
            Err(e) => {
                warn!(?e, "price-indexer: refresh failed; will retry");
            }
        }
    }
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
