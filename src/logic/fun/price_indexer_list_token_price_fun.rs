//! huggies_rex_price_indexer_list_token_price_fun
//!
//! Fetch every known token's metadata + USD price from the intear
//! `price-indexer` `/list-token-price` endpoint and return them as
//! `TOKEN_RECORD_TYPE` rows.
// =========================================
use std::collections::HashMap;

use anyhow::{Context, Result};
use chrono::Utc;
use serde::Deserialize;
use tracing::warn;

use crate::logic::types::token_record_type::TOKEN_RECORD_TYPE;
// =========================================
#[derive(Debug, Deserialize)]
struct PRICE_INDEXER_TOKEN_ENTRY {
    decimal: u32,
    price: String,
    symbol: String,
}
// =========================================
pub async fn huggies_rex_price_indexer_list_token_price_fun(
    http: &reqwest::Client,
    base_url: &str,
) -> Result<HashMap<String, TOKEN_RECORD_TYPE>> {
    let url = format!("{base_url}/list-token-price");
    let resp = http
        .get(&url)
        .send()
        .await
        .context("price-indexer /list-token-price request failed")?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        anyhow::bail!("price-indexer /list-token-price returned {status}: {body}");
    }
    let body: HashMap<String, PRICE_INDEXER_TOKEN_ENTRY> = resp
        .json()
        .await
        .context("price-indexer /list-token-price json parse failed")?;
    let now_ms = Utc::now().timestamp_millis();
    let mut out: HashMap<String, TOKEN_RECORD_TYPE> = HashMap::new();
    for (account_id, entry) in body {
        let price = match entry.price.parse::<f64>() {
            Ok(p) => Some(p),
            Err(e) => {
                warn!(?e, account_id, "price-indexer: failed to parse price");
                None
            }
        };
        let decimals = entry.decimal.min(u8::MAX as u32) as u8;
        out.insert(
            account_id.clone(),
            TOKEN_RECORD_TYPE {
                account_id,
                symbol: entry.symbol.clone(),
                name: entry.symbol,
                decimals,
                icon: None,
                price_usd: price,
                updated_at_unix_ms: now_ms,
            },
        );
    }
    Ok(out)
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
