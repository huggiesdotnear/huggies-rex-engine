// ========================================
// SWAP_QUEUE_ACCOUNTS_STORE
// the db access for the swap_queue_accounts table: one row per account,
// per queued swap. this is the WHO of a queued swap.
//
// --- WHY --- the WHO is a TABLE and not a json array: each object in
// the array is one row, and the fields of the object are columns. the
// array read on the wire is those rows serialized back to a list.
//
// --- WHY --- the status lives ONLY here: the one place where the truth
// is. a swap is not "sent" or "failed" on its own — it is sent BY an
// account, and each account's send is its own transaction with its own
// hash and its own outcome.
//
// --- WHY --- `swap_id` is the whole identity: a queued swap is ONE
// swap, not a batch of transactions, so there is no tx id in the middle
// of the key. one swap, one row per account.
use sqlx::{Row, SqlitePool};

use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_store::now_ms_fun;
// ========================================
// --- TYPES ------------------------------
// one account on one queued swap, as it comes out of the db.
#[derive(Debug, Clone)]
pub struct SWAP_QUEUE_ACCOUNT_ROW {
    // the swap the account is on.
    pub swap_id: String,
    // the account.
    pub account_id: String,
    // where the account is with this swap: pending, sent, succeeded or
    // failed.
    pub status: String,
    // the hash of the transaction the account sent. it is null until
    // somebody sends.
    pub tx_hash: Option<String>,
    // the amount that came out, in the output token's smallest unit. it
    // is null until somebody sends.
    pub amount_out: Option<String>,
    // when the row was created, in ms since the epoch.
    pub created_at: i64,
    // when the row was last touched, in ms since the epoch.
    pub updated_at: i64,
}
// ========================================
// --- INSERT ----------------------------
// create the row for one account on one queued swap.
//
// --- WHY --- the status is bound and not left to the column default: the
// caller says what the status is, and the default in the schema is only
// there for a row written by hand in the db.
//
// --- WHY --- this is a plain INSERT and not an upsert: adding the same
// account twice is a mistake the caller wants to hear about, and the
// primary key `(swap_id, account_id)` says so. the route turns the
// failure into a 409.
pub async fn swap_queue_accounts_insert_fun(
    pool: &SqlitePool,
    swap_id: &str,
    account_id: &str,
    status: &str,
) -> Result<(), sqlx::Error> {
    let now = now_ms_fun();

    sqlx::query(
        "INSERT INTO swap_queue_accounts
        (swap_id, account_id, status, tx_hash, amount_out, created_at, updated_at)
       VALUES (?1, ?2, ?3, NULL, NULL, ?4, ?4)",
    )
    .bind(swap_id)
    .bind(account_id)
    .bind(status)
    .bind(now)
    .execute(pool)
    .await?;

    Ok(())
}

// ========================================
// --- LIST BY SWAP ----------------------
// every account row on one queued swap.
//
// --- WHY --- it reads the account rows and NOT the swap: the question
// is "who is on this swap", and the answer is the rows that carry the
// swap id.
pub async fn swap_queue_accounts_list_by_swap_fun(
    pool: &SqlitePool,
    swap_id: &str,
) -> Result<Vec<SWAP_QUEUE_ACCOUNT_ROW>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT swap_id, account_id, status, tx_hash, amount_out, created_at, updated_at
       FROM swap_queue_accounts
      WHERE swap_id = ?1
      ORDER BY created_at ASC, account_id ASC",
    )
    .bind(swap_id)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_swap_queue_account_fun).collect())
}

// ========================================
// --- LIST BY ACCOUNT --------------------
// every account row of one account, across every swap.
//
// --- WHY --- this is the feed query: "the swaps for THIS account", and
// it is the one the `account_id` filter of the list is built on.
pub async fn swap_queue_accounts_list_by_account_fun(
    pool: &SqlitePool,
    account_id: &str,
) -> Result<Vec<SWAP_QUEUE_ACCOUNT_ROW>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT swap_id, account_id, status, tx_hash, amount_out, created_at, updated_at
       FROM swap_queue_accounts
      WHERE account_id = ?1
      ORDER BY created_at DESC",
    )
    .bind(account_id)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(row_to_swap_queue_account_fun).collect())
}

// ========================================
// --- HAS FOR ACCOUNT --------------------
// is this account on this swap at all?
//
// --- WHY --- it is an EXISTS and not a count: the answer is a yes or a
// no, and the count would say the same thing while reading more.
pub async fn swap_queue_accounts_has_for_account_fun(
    pool: &SqlitePool,
    swap_id: &str,
    account_id: &str,
) -> Result<bool, sqlx::Error> {
    let found: (i64,) = sqlx::query_as(
        "SELECT EXISTS(
           SELECT 1 FROM swap_queue_accounts
            WHERE swap_id = ?1
              AND account_id = ?2)",
    )
    .bind(swap_id)
    .bind(account_id)
    .fetch_one(pool)
    .await?;

    Ok(found.0 != 0)
}

// ========================================
// --- DELETE -----------------------------
// remove an account from a queued swap — and only while it has no hash.
//
// --- WHY --- ONLY the rows with NO hash are deleted: a row that carries a
// hash is HISTORY. it shows who did the swap and it stays, so the swap
// still says who sent it after the account has stepped off.
pub async fn swap_queue_accounts_delete_fun(
    pool: &SqlitePool,
    swap_id: &str,
    account_id: &str,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "DELETE FROM swap_queue_accounts
      WHERE swap_id = ?1
        AND account_id = ?2
        AND tx_hash IS NULL",
    )
    .bind(swap_id)
    .bind(account_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
}

// ========================================
// --- SET SENT --------------------------
// write the hash, the status and the amount out on an account's row.
//
// --- WHY --- this is an UPSERT and not an update: an account executing a
// swap it was NOT named on has no row yet, and executing it JOINS the
// swap — the row is created with the hash on it. an update would find
// nothing and the send would be lost.
//
// --- WHY --- the conflict branch REPLACES the hash, the status and the
// amount out: the row is the account's answer for that swap, and the
// answer changes when the outcome comes back — `sent` becomes
// `succeeded` or `failed`. the `created_at` is left alone, because the
// row was created when the account joined and not when the outcome
// arrived.
//
// --- WHY --- `amount_out` IS BOUND AND NOT SKIPPED WHEN IT IS NULL: a
// swap that went out but whose amount out could not be read still wrote
// a hash and a status, and the amount is simply not known. binding null
// says "not known" and leaves the old number alone for the case where
// the swap page reports the amount on a row that already has one.
pub async fn swap_queue_accounts_set_sent_fun(
    pool: &SqlitePool,
    swap_id: &str,
    account_id: &str,
    tx_hash: &str,
    status: &str,
    amount_out: Option<&str>,
) -> Result<u64, sqlx::Error> {
    let now = now_ms_fun();

    let result = sqlx::query(
        "INSERT INTO swap_queue_accounts
        (swap_id, account_id, status, tx_hash, amount_out, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
       ON CONFLICT (swap_id, account_id) DO UPDATE SET
         status = excluded.status,
         tx_hash = excluded.tx_hash,
         amount_out = COALESCE(excluded.amount_out, swap_queue_accounts.amount_out),
         updated_at = excluded.updated_at",
    )
    .bind(swap_id)
    .bind(account_id)
    .bind(status)
    .bind(tx_hash)
    .bind(amount_out)
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
// answer at one query instead of one per swap — and that read lives in
// `swap_queue_store`. so the row reader has to be reachable from there.
pub fn row_to_swap_queue_account_fun(
    row: &sqlx::sqlite::SqliteRow,
) -> SWAP_QUEUE_ACCOUNT_ROW {
    SWAP_QUEUE_ACCOUNT_ROW {
        swap_id: row.get("swap_id"),
        account_id: row.get("account_id"),
        status: row.get("status"),
        tx_hash: row.get("tx_hash"),
        amount_out: row.get("amount_out"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
