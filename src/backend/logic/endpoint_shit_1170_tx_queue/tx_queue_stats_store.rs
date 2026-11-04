// ========================================
// TX_QUEUE_STATS_STORE
// the db access for the two stats queries: how many queued transactions
// hit each contract, and how many called each method.
//
// --- WHY --- these are `GROUP BY` over the TRANSACTIONS table and not
// over the account rows: the question is "how many queued txs hit
// ref.finance.near", and a queued tx exists the moment it is queued —
// nobody has to have sent it for it to be a queued tx.
//
// --- WHY --- `contract_id` and `method` have their own COLUMNS and not
// one json blob: a `GROUP BY` on a column with an index is a cheap read,
// and a `GROUP BY` inside a json blob is a scan of every row, every
// time. these two queries are the whole reason those columns are
// columns.
//
// --- WHY --- the methods carry the CONTRACT ID along: `ft_swap` on two
// different contracts is two different transactions. a method count
// without the contract would blend them, and "the most common methods"
// would be a misleading number.
use sqlx::{Row, SqlitePool};
// ========================================
// --- TYPES ------------------------------
// one contract in the contract stats.
#[derive(Debug, Clone)]
pub struct TX_QUEUE_CONTRACT_STAT_ROW {
    // the contract.
    pub contract_id: String,
    // how many queued transactions hit it.
    pub count: i64,
}

// one method in the method stats.
#[derive(Debug, Clone)]
pub struct TX_QUEUE_METHOD_STAT_ROW {
    // the method.
    pub method: String,
    // the contract it was called on.
    pub contract_id: String,
    // how many queued transactions called it.
    pub count: i64,
}
// ========================================
// --- CONTRACTS -------------------------
// the most common contracts, biggest first.
//
// --- WHY --- the count is DESC and the contract id ASC: the biggest
// count first, and then the contract id so two contracts with the same
// count always come back in the same order. an unstable order makes the
// list jump around between two calls.
//
// --- WHY --- the limit is bound and not written into the sql: the sql
// stays one statement for every limit, and the value can never be
// anything but a number.
pub async fn tx_queue_stats_contracts_fun(
    pool: &SqlitePool,
    limit: i64,
) -> Result<Vec<TX_QUEUE_CONTRACT_STAT_ROW>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT contract_id, COUNT(1) AS count
       FROM tx_queue_transactions
      GROUP BY contract_id
      ORDER BY count DESC, contract_id ASC
      LIMIT ?1",
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .iter()
        .map(|row| TX_QUEUE_CONTRACT_STAT_ROW {
            contract_id: row.get("contract_id"),
            count: row.get("count"),
        })
        .collect())
}

// ========================================
// --- METHODS ----------------------------
// the most common methods, biggest first.
//
// --- WHY --- it groups by BOTH the method and the contract: the method
// alone would blend `ft_swap` on one contract with `ft_swap` on another,
// and the two are different transactions.
pub async fn tx_queue_stats_methods_fun(
    pool: &SqlitePool,
    limit: i64,
) -> Result<Vec<TX_QUEUE_METHOD_STAT_ROW>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT method, contract_id, COUNT(1) AS count
       FROM tx_queue_transactions
      GROUP BY method, contract_id
      ORDER BY count DESC, method ASC, contract_id ASC
      LIMIT ?1",
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .iter()
        .map(|row| TX_QUEUE_METHOD_STAT_ROW {
            method: row.get("method"),
            contract_id: row.get("contract_id"),
            count: row.get("count"),
        })
        .collect())
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
