// ========================================
// TX_QUEUE_STORE
// the db access for the tx_queue table. every read and every write of a
// queued batch goes through this file, so the sql lives in one place.
//
// --- WHY --- one row per BATCH and not per transaction: the agent
// queues a swap, and that swap needs three function calls — a deposit,
// the swap itself, and a withdrawal — so they go in together under one
// `queue_id`, and the user signs them as one batch, in one wallet popup.
//
// --- WHY --- the `what`, `when` and `why` live on the QUEUE and not on
// the transaction rows: they describe the batch, not one call. "swap 100
// USDC for NEAR" is the what of three calls taken together.
//
// --- WHY --- there is NO status column on this table: a queue is never
// done. at any moment another account can decide they want to send it,
// and they join. the status lives on the account row and nowhere else.
//
// --- WHY --- the `when` column is QUOTED in every statement that reads
// or writes it: `when` is a reserved word in sqlite, and an unquoted
// `when` in a column list is a syntax error. `why` and `when_at` are
// ordinary words and are left alone.
use sqlx::{Row, SqlitePool};
// ========================================
// --- TYPES ------------------------------
// one queued batch, as it comes out of the db.
#[derive(Debug, Clone)]
pub struct TX_QUEUE_ROW {
    // the batch's id. it is the row's primary key, and it is the uuid
    // that goes in the url.
    pub queue_id: String,
    // what the transactions do, in words. it may be nothing.
    pub what: Option<String>,
    // when they should happen, in words. it may be nothing.
    pub when_text: Option<String>,
    // why the user wants them. it may be nothing.
    pub why: Option<String>,
    // the machine-readable version of `when`, epoch ms. it is null when
    // there is no moment.
    pub when_at: Option<i64>,
    // when the batch was queued, in ms since the epoch.
    pub created_at: i64,
    // when the batch was last touched, in ms since the epoch.
    pub updated_at: i64,
}

// the filters on the queue list.
//
// --- WHY --- the filters are all OPTIONAL and carried in one struct: the
// list query is one statement with optional binds, and the caller fills
// in the ones it was given. a struct keeps the filters named, so the
// route cannot swap two of them by accident.
#[derive(Debug, Clone, Default)]
pub struct TX_QUEUE_LIST_QUERY {
    // only the queues this account is on.
    pub account_id: Option<String>,
    // with the account, drop the queues this account has already sent.
    pub hide_sent: Option<bool>,
    // only the queues holding a transaction for this contract.
    pub contract_id: Option<String>,
    // only the queues holding a transaction for this method.
    pub method: Option<String>,
    // how many to return.
    pub limit: i64,
    // where to start.
    pub offset: i64,
}
// ========================================
// --- INSERT ----------------------------
// create the queue row for a batch.
//
// --- WHY --- the row is written BEFORE the transactions: the
// transactions point at the queue, and a foreign key that points at
// nothing is not allowed.
//
// --- WHY --- `what`, `when` and `why` are bound as OPTIONALS and not as
// empty strings: an empty string is a sentence that says nothing, and
// null says "there was no what". the ui can tell them apart.
pub async fn tx_queue_insert_fun(
    pool: &SqlitePool,
    what: Option<&str>,
    when_text: Option<&str>,
    why: Option<&str>,
    when_at: Option<i64>,
    queue_id: &str,
) -> Result<(), sqlx::Error> {
    let now = now_ms_fun();

    sqlx::query(
        "INSERT INTO tx_queue
        (queue_id, what, \"when\", why, when_at, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)",
    )
    .bind(queue_id)
    .bind(what)
    .bind(when_text)
    .bind(why)
    .bind(when_at)
    .bind(now)
    .execute(pool)
    .await?;

    Ok(())
}

// ========================================
// --- GET -------------------------------
// one queued batch by its id, or None.
//
// --- WHY --- None and not an error: a queue id nobody has is not a broken
// db, it is a 404.
pub async fn tx_queue_get_fun(
    pool: &SqlitePool,
    queue_id: &str,
) -> Result<Option<TX_QUEUE_ROW>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT queue_id, what, \"when\", why, when_at, created_at, updated_at
       FROM tx_queue
      WHERE queue_id = ?1",
    )
    .bind(queue_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| row_to_tx_queue_fun(&row)))
}

// ========================================
// --- LIST ------------------------------
// the queue list, and how many queues matched before the limit and the
// offset took their cut.
//
// --- WHY --- the total is a SECOND statement and not a window function
// over the page: the total is the count of the WHOLE match, so it has to
// be counted before the limit and the offset cut it. a window function
// would count only the rows that survived.
//
// --- WHY --- the filters are OPTIONAL binds and the same `?1` is written
// THREE times: the account id is wanted in the `EXISTS` and again in the
// `NOT EXISTS`. sqlx's sqlite driver reads the bind parameter NAMES off
// the statement, and when a name is `?NNN` it binds argument NNN to that
// slot — so `?1` means "argument one" and it can be written as many times
// as the query wants. a plain `?` would be positional and could not be
// reused.
//
// --- WHY --- the optional filters bind an `Option` and are tested with
// `?1 IS NULL`: `None` means "this filter was not given" and the clause
// is skipped. that is why one statement serves every shape of the list
// and there is no second sql to keep in step with the first.
//
// --- WHY --- `hide_sent` needs the account: "has this account sent it"
// is a question about ONE account. a queue can be sent by alice and not
// by bob, so there is no such question about all the accounts at once.
// when the caller gives a `hide_sent` with no account, the `NOT EXISTS`
// never matches anything that account did and the filter falls away —
// the ROUTE is where that is refused, because the route knows it was a
// mistake and the store only knows the shape of the data.
//
// --- WHY --- the contract and the method filters use `EXISTS` over the
// TRANSACTIONS and not over the account rows: a queue holds a
// transaction for a contract even when nobody has sent it yet, and the
// queue is what the filter is about.
//
// --- WHY --- the order is `created_at DESC`: the list is a feed, and the
// newest batch is the one the reader wants.
pub async fn tx_queue_list_fun(
    pool: &SqlitePool,
    query: &TX_QUEUE_LIST_QUERY,
) -> Result<(Vec<TX_QUEUE_ROW>, i64), sqlx::Error> {
    let rows = sqlx::query(
        "SELECT queue_id, what, \"when\", why, when_at, created_at, updated_at
       FROM tx_queue
      WHERE ( ?1 IS NULL
           OR EXISTS (SELECT 1 FROM tx_queue_accounts a
                       WHERE a.queue_id = tx_queue.queue_id
                         AND a.account_id = ?1) )
        AND ( ?2 IS NULL OR ?2 = 0
           OR NOT EXISTS (SELECT 1 FROM tx_queue_accounts s
                           WHERE s.queue_id = tx_queue.queue_id
                             AND s.account_id = ?1
                             AND s.tx_hash IS NOT NULL) )
        AND ( ?3 IS NULL
           OR EXISTS (SELECT 1 FROM tx_queue_transactions t
                       WHERE t.queue_id = tx_queue.queue_id
                         AND t.contract_id = ?3) )
        AND ( ?4 IS NULL
           OR EXISTS (SELECT 1 FROM tx_queue_transactions t
                       WHERE t.queue_id = tx_queue.queue_id
                         AND t.method = ?4) )
      ORDER BY created_at DESC
      LIMIT ?5 OFFSET ?6",
    )
    .bind(query.account_id.as_deref())
    .bind(query.hide_sent)
    .bind(query.contract_id.as_deref())
    .bind(query.method.as_deref())
    .bind(query.limit)
    .bind(query.offset)
    .fetch_all(pool)
    .await?;

    let items = rows.iter().map(row_to_tx_queue_fun).collect();

    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(1)
       FROM tx_queue
      WHERE ( ?1 IS NULL
           OR EXISTS (SELECT 1 FROM tx_queue_accounts a
                       WHERE a.queue_id = tx_queue.queue_id
                         AND a.account_id = ?1) )
        AND ( ?2 IS NULL OR ?2 = 0
           OR NOT EXISTS (SELECT 1 FROM tx_queue_accounts s
                           WHERE s.queue_id = tx_queue.queue_id
                             AND s.account_id = ?1
                             AND s.tx_hash IS NOT NULL) )
        AND ( ?3 IS NULL
           OR EXISTS (SELECT 1 FROM tx_queue_transactions t
                       WHERE t.queue_id = tx_queue.queue_id
                         AND t.contract_id = ?3) )
        AND ( ?4 IS NULL
           OR EXISTS (SELECT 1 FROM tx_queue_transactions t
                       WHERE t.queue_id = tx_queue.queue_id
                         AND t.method = ?4) )",
    )
    .bind(query.account_id.as_deref())
    .bind(query.hide_sent)
    .bind(query.contract_id.as_deref())
    .bind(query.method.as_deref())
    .fetch_one(pool)
    .await?;

    Ok((items, total.0))
}

// ========================================
// --- DELETE ----------------------------
// delete a queue. its transactions and their account rows go with it.
//
// --- WHY --- it is a hard delete and not a soft one: a queued batch is
// immutable once queued, there is no edit, and there is no expiry. a
// soft delete would leave rows nobody can read behind a flag that
// nothing looks at.
pub async fn tx_queue_delete_fun(pool: &SqlitePool, queue_id: &str) -> Result<u64, sqlx::Error> {
    let result = sqlx::query("DELETE FROM tx_queue WHERE queue_id = ?1")
        .bind(queue_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected())
}
// ========================================
// --- HELPERS ----------------------------
// turn a db row into a queued batch.
fn row_to_tx_queue_fun(row: &sqlx::sqlite::SqliteRow) -> TX_QUEUE_ROW {
    TX_QUEUE_ROW {
        queue_id: row.get("queue_id"),
        what: row.get("what"),
        when_text: row.get("when"),
        why: row.get("why"),
        when_at: row.get("when_at"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

// the current time in ms since the epoch.
pub fn now_ms_fun() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis() as i64)
        .unwrap_or(0)
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
