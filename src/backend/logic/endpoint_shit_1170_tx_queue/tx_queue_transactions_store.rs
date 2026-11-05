// ========================================
// TX_QUEUE_TRANSACTIONS_STORE
// the db access for the tx_queue_transactions table: one row per
// transaction inside a queued batch.
//
// --- WHY --- only FUNCTION CALLS are queued: no transfers, no key
// management, no account creation. each row carries the near-kit toolbox
// `generic_contract_call_fun` shape — contract id, method, args, gas,
// deposit — so the frontend can hand the transactions straight to
// `generic_contract_call_wallet` without reshaping them.
//
// --- WHY --- `contract_id`, `method` and `args` have their OWN columns
// and not one json blob: the plan is to later show "the most common
// contracts and methods" in the ui. a `contract_id` column with an
// index answers "how many queued txs hit ref.finance.near" with a
// `GROUP BY`. inside a json blob it is a json scan on every row, every
// time. `args` stays a json string because it is a bag of arbitrary keys
// with no shape — there is nothing to group by.
//
// --- WHY --- `position` is the order of the transactions: a batch of
// three calls has an order — the deposit comes first, the swap second,
// the withdrawal third — and `position` is that order, `0, 1, 2` within
// the queue.
use sqlx::{Row, SqlitePool};

use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_store::now_ms_fun;
// ========================================
// --- TYPES ------------------------------
// one queued transaction, as it comes out of the db.
#[derive(Debug, Clone)]
pub struct TX_QUEUE_TRANSACTION_ROW {
    // the transaction's id. it is the row's primary key, and it is a uuid
    // so it does not move when the batch is renumbered.
    pub tx_id: String,
    // the batch this transaction belongs to.
    pub queue_id: String,
    // the order of this transaction inside the batch, from zero.
    pub position: i64,
    // the contract being called.
    pub contract_id: String,
    // the method name.
    pub method: String,
    // the arguments, as a json string. the wire shape is a json object.
    pub args: String,
    // the gas, as a string. it may be nothing.
    pub gas: Option<String>,
    // the deposit, as a string. it may be nothing.
    pub deposit: Option<String>,
    // when the transaction was queued, in ms since the epoch.
    pub created_at: i64,
    // when the transaction was last touched, in ms since the epoch.
    pub updated_at: i64,
}
// ========================================
// --- INSERT ----------------------------
// create the row for one transaction of a batch.
//
// --- WHY --- the args are stored as the STRING they were given: the
// column is text, and the json <-> column conversion lives in
// `tx_queue_args_fun` so the two directions can never disagree.
//
// --- WHY --- there are NINE arguments and not a struct: every one of
// them is a COLUMN of the row, and a struct would only move the columns
// into a struct and give the caller another thing to fill in. the
// columns are the shape.
#[allow(clippy::too_many_arguments)]
pub async fn tx_queue_transactions_insert_fun(
    pool: &SqlitePool,
    tx_id: &str,
    queue_id: &str,
    position: i64,
    contract_id: &str,
    method: &str,
    args: &str,
    gas: Option<&str>,
    deposit: Option<&str>,
) -> Result<(), sqlx::Error> {
    let now = now_ms_fun();

    sqlx::query(
        "INSERT INTO tx_queue_transactions
        (tx_id, queue_id, position, contract_id, method, args, gas, deposit, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)",
    )
    .bind(tx_id)
    .bind(queue_id)
    .bind(position)
    .bind(contract_id)
    .bind(method)
    .bind(args)
    .bind(gas)
    .bind(deposit)
    .bind(now)
    .execute(pool)
    .await?;

    Ok(())
}

// ========================================
// --- LIST BY QUEUE ---------------------
// the transactions of one batch, in `position` order.
//
// --- WHY --- the order is `position ASC` and not the rowid: the position
// is the order the wallet popup has to get them in, and it is the order
// the agent wrote them in.
pub async fn tx_queue_transactions_list_by_queue_fun(
    pool: &SqlitePool,
    queue_id: &str,
) -> Result<Vec<TX_QUEUE_TRANSACTION_ROW>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT tx_id, queue_id, position, contract_id, method, args, gas, deposit, created_at, updated_at
       FROM tx_queue_transactions
      WHERE queue_id = ?1
      ORDER BY position ASC",
    )
    .bind(queue_id)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_tx_queue_transaction_fun).collect())
}

// ========================================
// --- GET -------------------------------
// one queued transaction by its id, or None.
pub async fn tx_queue_transactions_get_fun(
    pool: &SqlitePool,
    tx_id: &str,
) -> Result<Option<TX_QUEUE_TRANSACTION_ROW>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT tx_id, queue_id, position, contract_id, method, args, gas, deposit, created_at, updated_at
       FROM tx_queue_transactions
      WHERE tx_id = ?1",
    )
    .bind(tx_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| row_to_tx_queue_transaction_fun(&row)))
}
// ========================================
// --- HELPERS ----------------------------
// turn a db row into a queued transaction.
//
// --- WHY --- IT IS PUBLIC: the store reads the transactions of a WHOLE
// PAGE in one query — that is the batched read that keeps the feed's
// answer at two queries instead of two per batch — and that read lives
// in `tx_queue_store`. so the row reader has to be reachable from there.
pub fn row_to_tx_queue_transaction_fun(row: &sqlx::sqlite::SqliteRow) -> TX_QUEUE_TRANSACTION_ROW {
    TX_QUEUE_TRANSACTION_ROW {
        tx_id: row.get("tx_id"),
        queue_id: row.get("queue_id"),
        position: row.get("position"),
        contract_id: row.get("contract_id"),
        method: row.get("method"),
        args: row.get("args"),
        gas: row.get("gas"),
        deposit: row.get("deposit"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
