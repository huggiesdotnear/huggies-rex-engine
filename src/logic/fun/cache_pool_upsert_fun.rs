//! huggies_rex_cache_pool_upsert_fun
//!
//! Upsert a `POOL_RECORD_TYPE` row into the `pools` table.
// =========================================
use anyhow::Result;
use rusqlite::{Connection, params};

use crate::logic::types::pool_record_type::POOL_RECORD_TYPE;
// =========================================
pub fn huggies_rex_cache_pool_upsert_fun(conn: &Connection, pool: &POOL_RECORD_TYPE) -> Result<()> {
    let tokens_json = serde_json::to_string(&pool.token_account_ids)?;
    let amounts_json = serde_json::to_string(&pool.amounts)?;
    conn.execute(
        r#"
        INSERT INTO pools (pool_id, pool_kind, token_account_ids, amounts,
                           total_fee, shares_total_supply, amp, tvl_usd, updated_at_ms)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        ON CONFLICT(pool_id) DO UPDATE SET
            pool_kind          = excluded.pool_kind,
            token_account_ids  = excluded.token_account_ids,
            amounts            = excluded.amounts,
            total_fee          = excluded.total_fee,
            shares_total_supply = excluded.shares_total_supply,
            amp                = excluded.amp,
            tvl_usd            = excluded.tvl_usd,
            updated_at_ms      = excluded.updated_at_ms
        "#,
        params![
            pool.pool_id as i64,
            pool.pool_kind,
            tokens_json,
            amounts_json,
            pool.total_fee as i64,
            pool.shares_total_supply,
            pool.amp as i64,
            pool.tvl_usd,
            pool.updated_at_unix_ms,
        ],
    )?;
    Ok(())
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
