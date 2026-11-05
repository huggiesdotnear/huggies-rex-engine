// ========================================
// TX_QUEUE_ACCOUNTS_STORE
// the db access for the tx_queue_accounts table: one row per account, per
// transaction. this is the WHO of a queued batch.
//
// --- WHY --- the WHO is a TABLE and not a json array: each object in the
// array is one row, and the three fields of the object are three columns
// — `account_id`, `status` and `tx_hash`. the array read on the wire is
// those rows serialized back to a list. nothing is added and nothing is
// lost.
//
// --- WHY --- the account row hangs off the TRANSACTION and not off the
// QUEUE: a queue has three transactions, the user signs all three
// together, and EACH transaction produces its OWN hash. the hash cannot
// live on the account row of the queue, or three hashes would collide in
// one column.
//
// --- WHY --- the status lives ONLY here: the one place where the truth
// is. a transaction is not "sent" or "failed" on its own — it is sent BY
// an account, and each account's send is its own transaction with its own
// hash and its own outcome.
//
// --- WHY --- `queue_id` is kept as a column even though it is not part of
// the primary key: a query for "every account on this queue" is one
// indexed read with no join through the transactions table.
use sqlx::{Row, SqlitePool};

use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_store::now_ms_fun;
// ========================================
// --- TYPES ------------------------------
// one account on one transaction, as it comes out of the db.
#[derive(Debug, Clone)]
pub struct TX_QUEUE_ACCOUNT_ROW {
    // the batch the transaction belongs to.
    pub queue_id: String,
    // the transaction the account is on.
    pub tx_id: String,
    // the account.
    pub account_id: String,
    // where the account is with this transaction: pending, sent,
    // succeeded or failed.
    pub status: String,
    // the hash of the transaction the account sent. it is null until
    // somebody sends.
    pub tx_hash: Option<String>,
    // when the row was created, in ms since the epoch.
    pub created_at: i64,
    // when the row was last touched, in ms since the epoch.
    pub updated_at: i64,
}
// ========================================
// --- INSERT ----------------------------
// create the row for one account on one transaction.
//
// --- WHY --- the status is bound and not left to the column default: the
// caller says what the status is, and the default in the schema is only
// there for a row written by hand in the db.
//
// --- WHY --- this is a plain INSERT and not an upsert: adding the same
// account twice is a mistake the caller wants to hear about, and the
// primary key `(tx_id, account_id)` says so. the route turns the failure
// into a 409.
pub async fn tx_queue_accounts_insert_fun(
    pool: &SqlitePool,
    queue_id: &str,
    tx_id: &str,
    account_id: &str,
    status: &str,
) -> Result<(), sqlx::Error> {
    let now = now_ms_fun();

    sqlx::query(
        "INSERT INTO tx_queue_accounts
        (queue_id, tx_id, account_id, status, tx_hash, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, NULL, ?5, ?5)",
    )
    .bind(queue_id)
    .bind(tx_id)
    .bind(account_id)
    .bind(status)
    .bind(now)
    .execute(pool)
    .await?;

    Ok(())
}

// ========================================
// --- LIST BY QUEUE ---------------------
// every account row on one batch.
//
// --- WHY --- it reads the account rows and NOT the transactions: the
// question is "who is on this queue", and the answer is the rows that
// carry the queue id. the transactions are read separately for the
// batch's calls.
pub async fn tx_queue_accounts_list_by_queue_fun(
    pool: &SqlitePool,
    queue_id: &str,
) -> Result<Vec<TX_QUEUE_ACCOUNT_ROW>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT queue_id, tx_id, account_id, status, tx_hash, created_at, updated_at
       FROM tx_queue_accounts
      WHERE queue_id = ?1
      ORDER BY created_at ASC, tx_id ASC, account_id ASC",
    )
    .bind(queue_id)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_tx_queue_account_fun).collect())
}

// ========================================
// --- LIST BY TX ------------------------
// every account row under one transaction.
pub async fn tx_queue_accounts_list_by_tx_fun(
    pool: &SqlitePool,
    tx_id: &str,
) -> Result<Vec<TX_QUEUE_ACCOUNT_ROW>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT queue_id, tx_id, account_id, status, tx_hash, created_at, updated_at
       FROM tx_queue_accounts
      WHERE tx_id = ?1
      ORDER BY account_id ASC",
    )
    .bind(tx_id)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_tx_queue_account_fun).collect())
}

// ========================================
// --- LIST BY ACCOUNT --------------------
// every account row of one account, across every queue.
//
// --- WHY --- this is the feed query: "the txs for THIS account", and it
// is the one the `account_id` filter of the list is built on.
pub async fn tx_queue_accounts_list_by_account_fun(
    pool: &SqlitePool,
    account_id: &str,
) -> Result<Vec<TX_QUEUE_ACCOUNT_ROW>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT queue_id, tx_id, account_id, status, tx_hash, created_at, updated_at
       FROM tx_queue_accounts
      WHERE account_id = ?1
      ORDER BY created_at DESC",
    )
    .bind(account_id)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_tx_queue_account_fun).collect())
}

// ========================================
// --- HAS FOR ACCOUNT --------------------
// is this account on this queue at all?
//
// --- WHY --- it is an EXISTS and not a count: the answer is a yes or a
// no, and the count would say the same thing while reading more.
pub async fn tx_queue_accounts_has_for_account_fun(
    pool: &SqlitePool,
    queue_id: &str,
    account_id: &str,
) -> Result<bool, sqlx::Error> {
    let found: (i64,) = sqlx::query_as(
        "SELECT EXISTS(
           SELECT 1 FROM tx_queue_accounts
            WHERE queue_id = ?1
              AND account_id = ?2)",
    )
    .bind(queue_id)
    .bind(account_id)
    .fetch_one(pool)
    .await?;

    Ok(found.0 != 0)
}

// ========================================
// --- DELETE -----------------------------
// remove an account from a transaction — and only while it has no hash.
//
// --- WHY --- ONLY the rows with NO hash are deleted: a row that carries a
// hash is HISTORY. it shows who did the transaction and it stays, so the
// queue still says who sent it after the account has stepped off.
//
// --- WHY --- the queue id is NOT part of the where clause: the account
// row's identity is `(tx_id, account_id)`, and the route removes the
// account from the WHO of the whole batch — one call under every
// transaction of the batch.
pub async fn tx_queue_accounts_delete_fun(
    pool: &SqlitePool,
    tx_id: &str,
    account_id: &str,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "DELETE FROM tx_queue_accounts
      WHERE tx_id = ?1
        AND account_id = ?2
        AND tx_hash IS NULL",
    )
    .bind(tx_id)
    .bind(account_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
}

// ========================================
// --- SET SENT --------------------------
// write the hash and the status on an account's row under a transaction.
//
// --- WHY --- this is an UPSERT and not an update: an account signing a
// queue it was NOT named on has no row yet, and signing it JOINS the
// queue — the row is created with the hash on it. an update would find
// nothing and the send would be lost.
//
// --- WHY --- the conflict branch REPLACES the hash and the status: the
// row is the account's answer for that transaction, and the answer
// changes when the outcome comes back — `sent` becomes `succeeded` or
// `failed`. the `created_at` is left alone, because the row was created
// when the account joined and not when the outcome arrived.
//
// --- WHY --- the `queue_id` is written on the conflict branch too: a row
// that was created by a different path might carry a stale queue id, and
// the queue id is what "the accounts on this queue" reads.
pub async fn tx_queue_accounts_set_sent_fun(
    pool: &SqlitePool,
    tx_id: &str,
    account_id: &str,
    tx_hash: &str,
    status: &str,
) -> Result<u64, sqlx::Error> {
    let now = now_ms_fun();

    // the queue the transaction belongs to, so a row that is created
    // here carries the right queue id.
    let queue_id: Option<(String,)> =
        sqlx::query_as("SELECT queue_id FROM tx_queue_transactions WHERE tx_id = ?1")
            .bind(tx_id)
            .fetch_optional(pool)
            .await?;

    let queue_id = match queue_id {
        Some((queue_id,)) => queue_id,
        None => return Ok(0),
    };

    let result = sqlx::query(
        "INSERT INTO tx_queue_accounts
        (queue_id, tx_id, account_id, status, tx_hash, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
       ON CONFLICT (tx_id, account_id) DO UPDATE SET
         queue_id = excluded.queue_id,
         status = excluded.status,
         tx_hash = excluded.tx_hash,
         updated_at = excluded.updated_at",
    )
    .bind(&queue_id)
    .bind(tx_id)
    .bind(account_id)
    .bind(status)
    .bind(tx_hash)
    .bind(now)
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
}
// ========================================
// --- HELPERS ----------------------------
// turn a db row into an account row.
//
// --- WHY --- IT IS PUBLIC: the store reads the account rows of a WHOLE
// PAGE in one query — that is the batched read that keeps the feed's
// answer at two queries instead of two per batch — and that read lives
// in `tx_queue_store`. so the row reader has to be reachable from there.
pub fn row_to_tx_queue_account_fun(
    row: &sqlx::sqlite::SqliteRow,
) -> TX_QUEUE_ACCOUNT_ROW {
    TX_QUEUE_ACCOUNT_ROW {
        queue_id: row.get("queue_id"),
        tx_id: row.get("tx_id"),
        account_id: row.get("account_id"),
        status: row.get("status"),
        tx_hash: row.get("tx_hash"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
