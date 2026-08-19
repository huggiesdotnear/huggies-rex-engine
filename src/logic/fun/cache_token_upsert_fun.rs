//! huggies_rex_cache_token_upsert_fun
//!
//! Upsert a `TOKEN_RECORD_TYPE` row into the `tokens` table.
// =========================================
use anyhow::Result;
use rusqlite::{Connection, params};

use crate::logic::types::token_record_type::TOKEN_RECORD_TYPE;
// =========================================
pub fn huggies_rex_cache_token_upsert_fun(
    conn: &Connection,
    token: &TOKEN_RECORD_TYPE,
) -> Result<()> {
    conn.execute(
        r#"
        INSERT INTO tokens (account_id, symbol, name, decimals, icon, price_usd, updated_at_ms)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        ON CONFLICT(account_id) DO UPDATE SET
            symbol        = excluded.symbol,
            name          = excluded.name,
            decimals      = excluded.decimals,
            icon          = excluded.icon,
            price_usd     = excluded.price_usd,
            updated_at_ms = excluded.updated_at_ms
        "#,
        params![
            token.account_id,
            token.symbol,
            token.name,
            token.decimals as i64,
            token.icon,
            token.price_usd,
            token.updated_at_unix_ms,
        ],
    )?;
    Ok(())
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
