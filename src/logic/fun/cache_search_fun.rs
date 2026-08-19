//! huggies_rex_cache_search_fun
//!
//! FTS5-backed search over tokens and pools.
// =========================================
use anyhow::Result;
use rusqlite::{Connection, params};

use crate::logic::types::search_hit_type::{SEARCH_HIT_KIND_TYPE, SEARCH_HIT_TYPE};
// =========================================
pub fn huggies_rex_cache_search_fun(
    conn: &Connection,
    query: &str,
    limit: usize,
) -> Result<Vec<SEARCH_HIT_TYPE>> {
    let mut hits: Vec<SEARCH_HIT_TYPE> = Vec::new();
    let q = format!("{query}*");
    let mut stmt = conn.prepare(
        r#"
        SELECT account_id, symbol, name
        FROM tokens_fts
        WHERE tokens_fts MATCH ?1
        LIMIT ?2
        "#,
    )?;
    let mut rows = stmt.query(params![q, limit as i64])?;
    while let Some(row) = rows.next()? {
        let account_id: String = row.get(0)?;
        let symbol: String = row.get(1)?;
        let name: String = row.get(2)?;
        hits.push(SEARCH_HIT_TYPE {
            kind: SEARCH_HIT_KIND_TYPE::Token,
            id: account_id.clone(),
            label: symbol,
            sub_label: Some(name),
        });
    }
    drop(rows);
    drop(stmt);

    let mut stmt = conn.prepare(
        r#"
        SELECT pool_id, token_account_ids
        FROM pools_fts
        WHERE pools_fts MATCH ?1
        LIMIT ?2
        "#,
    )?;
    let mut rows = stmt.query(params![q, limit as i64])?;
    while let Some(row) = rows.next()? {
        let pool_id: i64 = row.get(0)?;
        let tokens_json: String = row.get(1)?;
        let tokens: Vec<String> = serde_json::from_str(&tokens_json).unwrap_or_default();
        hits.push(SEARCH_HIT_TYPE {
            kind: SEARCH_HIT_KIND_TYPE::Pool,
            id: pool_id.to_string(),
            label: format!("Pool #{}", pool_id),
            sub_label: Some(tokens.join(" / ")),
        });
    }
    Ok(hits)
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
