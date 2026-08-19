//! huggies_rex_cache_sqlite_open_fun
//!
//! Open (or create) the sqlite cache file used for pools, tokens, and
//! their full-text search indexes. Returns an open connection.
// =========================================
use std::path::Path;

use anyhow::Result;
use rusqlite::Connection;
// =========================================
pub fn huggies_rex_cache_sqlite_open_fun(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "synchronous", "NORMAL")?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS pools (
            pool_id            INTEGER PRIMARY KEY,
            pool_kind          TEXT NOT NULL,
            token_account_ids  TEXT NOT NULL,
            amounts            TEXT NOT NULL,
            total_fee          INTEGER NOT NULL,
            shares_total_supply TEXT NOT NULL,
            amp                INTEGER NOT NULL,
            tvl_usd            REAL,
            updated_at_ms      INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tokens (
            account_id   TEXT PRIMARY KEY,
            symbol       TEXT NOT NULL,
            name         TEXT NOT NULL,
            decimals     INTEGER NOT NULL,
            icon         TEXT,
            price_usd    REAL,
            updated_at_ms INTEGER NOT NULL
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS tokens_fts USING fts5(
            account_id,
            symbol,
            name,
            content='tokens',
            content_rowid='rowid'
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS pools_fts USING fts5(
            pool_id UNINDEXED,
            token_account_ids,
            content='pools',
            content_rowid='rowid'
        );

        CREATE TRIGGER IF NOT EXISTS tokens_ai AFTER INSERT ON tokens BEGIN
            INSERT INTO tokens_fts(rowid, account_id, symbol, name)
            VALUES (new.rowid, new.account_id, new.symbol, new.name);
        END;
        CREATE TRIGGER IF NOT EXISTS tokens_ad AFTER DELETE ON tokens BEGIN
            INSERT INTO tokens_fts(tokens_fts, rowid, account_id, symbol, name)
            VALUES('delete', old.rowid, old.account_id, old.symbol, old.name);
        END;
        CREATE TRIGGER IF NOT EXISTS tokens_au AFTER UPDATE ON tokens BEGIN
            INSERT INTO tokens_fts(tokens_fts, rowid, account_id, symbol, name)
            VALUES('delete', old.rowid, old.account_id, old.symbol, old.name);
            INSERT INTO tokens_fts(rowid, account_id, symbol, name)
            VALUES (new.rowid, new.account_id, new.symbol, new.name);
        END;

        CREATE TRIGGER IF NOT EXISTS pools_ai AFTER INSERT ON pools BEGIN
            INSERT INTO pools_fts(rowid, pool_id, token_account_ids)
            VALUES (new.rowid, new.pool_id, new.token_account_ids);
        END;
        CREATE TRIGGER IF NOT EXISTS pools_ad AFTER DELETE ON pools BEGIN
            INSERT INTO pools_fts(pools_fts, rowid, pool_id, token_account_ids)
            VALUES('delete', old.rowid, old.pool_id, old.token_account_ids);
        END;
        CREATE TRIGGER IF NOT EXISTS pools_au AFTER UPDATE ON pools BEGIN
            INSERT INTO pools_fts(pools_fts, rowid, pool_id, token_account_ids)
            VALUES('delete', old.rowid, old.pool_id, old.token_account_ids);
            INSERT INTO pools_fts(rowid, pool_id, token_account_ids)
            VALUES (new.rowid, new.pool_id, new.token_account_ids);
        END;

        CREATE INDEX IF NOT EXISTS idx_tokens_symbol ON tokens(symbol);
        CREATE INDEX IF NOT EXISTS idx_pools_kind ON pools(pool_kind);
        "#,
    )?;
    Ok(conn)
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
