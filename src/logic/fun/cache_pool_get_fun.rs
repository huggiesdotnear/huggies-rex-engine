//! huggies_rex_cache_pool_get_fun
//!
//! Read a single pool row by id from the `pools` table.
// =========================================
use anyhow::{Context, Result};
use rusqlite::{Connection, OptionalExtension, params};

use crate::logic::types::pool_record_type::POOL_RECORD_TYPE;
// =========================================
pub fn huggies_rex_cache_pool_get_fun(
    conn: &Connection,
    pool_id: u64,
) -> Result<Option<POOL_RECORD_TYPE>> {
    let row = conn
        .query_row(
            r#"
            SELECT pool_id, pool_kind, token_account_ids, amounts,
                   total_fee, shares_total_supply, amp, tvl_usd, updated_at_ms
            FROM pools WHERE pool_id = ?1
            "#,
            params![pool_id as i64],
            |row| {
                let tokens_json: String = row.get(2)?;
                let amounts_json: String = row.get(3)?;
                Ok(POOL_RECORD_TYPE {
                    pool_id: row.get::<_, i64>(0)? as u64,
                    pool_kind: row.get(1)?,
                    token_account_ids: serde_json::from_str(&tokens_json).unwrap_or_default(),
                    amounts: serde_json::from_str(&amounts_json).unwrap_or_default(),
                    total_fee: row.get::<_, i64>(4)? as u32,
                    shares_total_supply: row.get(5)?,
                    amp: row.get::<_, i64>(6)? as u64,
                    tvl_usd: row.get(7)?,
                    updated_at_unix_ms: row.get(8)?,
                })
            },
        )
        .optional()
        .context("failed to query pool row")?;
    Ok(row)
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
