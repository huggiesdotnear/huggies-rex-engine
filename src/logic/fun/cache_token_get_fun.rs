//! huggies_rex_cache_token_get_fun
//!
//! Read a single token row by account id from the `tokens` table.
// =========================================
use anyhow::{Context, Result};
use rusqlite::{Connection, OptionalExtension, params};

use crate::logic::types::token_record_type::TOKEN_RECORD_TYPE;
// =========================================
pub fn huggies_rex_cache_token_get_fun(
    conn: &Connection,
    account_id: &str,
) -> Result<Option<TOKEN_RECORD_TYPE>> {
    let row = conn
        .query_row(
            r#"
            SELECT account_id, symbol, name, decimals, icon, price_usd, updated_at_ms
            FROM tokens WHERE account_id = ?1
            "#,
            params![account_id],
            |row| {
                Ok(TOKEN_RECORD_TYPE {
                    account_id: row.get(0)?,
                    symbol: row.get(1)?,
                    name: row.get(2)?,
                    decimals: row.get::<_, i64>(3)? as u8,
                    icon: row.get(4)?,
                    price_usd: row.get(5)?,
                    updated_at_unix_ms: row.get(6)?,
                })
            },
        )
        .optional()
        .context("failed to query token row")?;
    Ok(row)
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
