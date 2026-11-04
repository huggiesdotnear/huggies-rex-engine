// ========================================
// SWAP_QUEUE_STORE
// the db access for the swap_queue table. every read and every write of a
// queued swap goes through this file, so the sql lives in one place.
//
// --- WHY --- one row per SWAP and not per transaction: the agent does
// not know the route. it knows the token in, the amount in and the token
// out, and the route is worked out at the moment somebody executes it.
//
// --- WHY --- the `what`, `when` and `why` live on the SWAP: they
// describe the swap, and they are the same three fields the tx queue
// carries, so a reader sees one kind of post whether it is a swap or a
// batch of calls.
//
// --- WHY --- there is NO status column on this table: a queued swap is
// never done. at any moment another account can decide they want it,
// and they join. the status lives on the account row and nowhere else.
//
// --- WHY --- the `when` column is QUOTED in every statement that reads
// or writes it: `when` is a reserved word in sqlite, and an unquoted
// `when` in a column list is a syntax error. `why` and `when_at` are
// ordinary words and are left alone.
use sqlx::{Row, SqlitePool};
// ========================================
// --- TYPES ------------------------------
// one queued swap, as it comes out of the db.
#[derive(Debug, Clone)]
pub struct SWAP_QUEUE_ROW {
    // the swap's id. it is the row's primary key, and it is the uuid
    // that goes in the url.
    pub swap_id: String,
    // what the swap does, in words. it may be nothing.
    pub what: Option<String>,
    // when it should happen, in words. it may be nothing.
    pub when_text: Option<String>,
    // why the user wants it. it may be nothing.
    pub why: Option<String>,
    // the machine-readable version of `when`, epoch ms. it is null when
    // there is no moment.
    pub when_at: Option<i64>,
    // the token being sold.
    pub token_in: String,
    // the raw amount of the token in that is sold, in the token's
    // smallest unit.
    pub amount_in: String,
    // the token being bought.
    pub token_out: String,
    // the quoted amount out, in the output token's smallest unit. it is
    // null when nothing was quoted yet.
    pub amount_out: Option<String>,
    // the dex the quote came from. it is null when no dex was named.
    pub dex_id: Option<String>,
    // when the swap was queued, in ms since the epoch.
    pub created_at: i64,
    // when the swap was last touched, in ms since the epoch.
    pub updated_at: i64,
}

// the filters on the swap list.
//
// --- WHY --- the filters are all OPTIONAL and carried in one struct: the
// list query is one statement with optional binds, and the caller fills
// in the ones it was given. a struct keeps the filters named, so the
// route cannot swap two of them by accident.
#[derive(Debug, Clone, Default)]
pub struct SWAP_QUEUE_LIST_QUERY {
    // only the swaps this account is on.
    pub account_id: Option<String>,
    // with the account, drop the swaps this account has already sent.
    pub hide_sent: Option<bool>,
    // only the swaps that sell this token.
    pub token_in: Option<String>,
    // only the swaps that buy this token.
    pub token_out: Option<String>,
    // how many to return.
    pub limit: i64,
    // where to start.
    pub offset: i64,
}
// ========================================
// --- INSERT ----------------------------
// create the swap row.
//
// --- WHY --- the row is written BEFORE the account rows: they point at
// it, and a foreign key that points at nothing is not allowed.
//
// --- WHY --- `what`, `when` and `why` are bound as OPTIONALS and not as
// empty strings: an empty string is a sentence that says nothing, and
// null says "there was no what". the ui can tell them apart.
//
// --- WHY --- `amount_out` and `dex_id` are OPTIONALS: the agent may
// queue a swap without a quote, and the quote is worked out live anyway.
pub async fn swap_queue_insert_fun(
    pool: &SqlitePool,
    swap_id: &str,
    what: Option<&str>,
    when_text: Option<&str>,
    why: Option<&str>,
    when_at: Option<i64>,
    token_in: &str,
    amount_in: &str,
    token_out: &str,
    amount_out: Option<&str>,
    dex_id: Option<&str>,
) -> Result<(), sqlx::Error> {
    let now = now_ms_fun();

    sqlx::query(
        "INSERT INTO swap_queue
        (swap_id, what, \"when\", why, when_at, token_in, amount_in, token_out,
         amount_out, dex_id, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?11)",
    )
    .bind(swap_id)
    .bind(what)
    .bind(when_text)
    .bind(why)
    .bind(when_at)
    .bind(token_in)
    .bind(amount_in)
    .bind(token_out)
    .bind(amount_out)
    .bind(dex_id)
    .bind(now)
    .execute(pool)
    .await?;

    Ok(())
}

// ========================================
// --- GET -------------------------------
// one queued swap by its id, or None.
//
// --- WHY --- None and not an error: a swap id nobody has is not a broken
// db, it is a 404.
pub async fn swap_queue_get_fun(
    pool: &SqlitePool,
    swap_id: &str,
) -> Result<Option<SWAP_QUEUE_ROW>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT swap_id, what, \"when\", why, when_at, token_in, amount_in,
                token_out, amount_out, dex_id, created_at, updated_at
       FROM swap_queue
      WHERE swap_id = ?1",
    )
    .bind(swap_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| row_to_swap_queue_fun(&row)))
}

// ========================================
// --- LIST ------------------------------
// the swap list, and how many swaps matched before the limit and the
// offset took their cut.
//
// --- WHY --- the total is a SECOND statement and not a window function
// over the page: the total is the count of the WHOLE match, so it has to
// be counted before the limit and the offset cut it. a window function
// would count only the rows that survived.
//
// --- WHY --- the optional filters bind an `Option` and are tested with
// `?1 IS NULL`: `None` means "this filter was not given" and the clause
// is skipped. that is why one statement serves every shape of the list
// and there is no second sql to keep in step with the first.
//
// --- WHY --- `hide_sent` needs the account: "has this account sent it"
// is a question about ONE account. a swap can be sent by alice and not
// by bob, so there is no such question about all the accounts at once.
// when the caller gives a `hide_sent` with no account, the `NOT EXISTS`
// never matches anything that account did and the filter falls away —
// the ROUTE is where that is refused, because the route knows it was a
// mistake and the store only knows the shape of the data.
//
// --- WHY --- the token filters are plain comparisons and not `EXISTS`
// over another table: the token in and the token out are COLUMNS on the
// swap, not rows on a transaction table. a queued swap has no
// transactions until somebody signs it.
//
// --- WHY --- the order is `created_at DESC`: the list is a feed, and the
// newest swap is the one the reader wants.
pub async fn swap_queue_list_fun(
    pool: &SqlitePool,
    query: &SWAP_QUEUE_LIST_QUERY,
) -> Result<(Vec<SWAP_QUEUE_ROW>, i64), sqlx::Error> {
    let rows = sqlx::query(
        "SELECT swap_id, what, \"when\", why, when_at, token_in, amount_in,
                token_out, amount_out, dex_id, created_at, updated_at
       FROM swap_queue
      WHERE ( ?1 IS NULL
           OR EXISTS (SELECT 1 FROM swap_queue_accounts a
                       WHERE a.swap_id = swap_queue.swap_id
                         AND a.account_id = ?1) )
        AND ( ?2 IS NULL OR ?2 = 0
           OR NOT EXISTS (SELECT 1 FROM swap_queue_accounts s
                           WHERE s.swap_id = swap_queue.swap_id
                             AND s.account_id = ?1
                             AND s.tx_hash IS NOT NULL) )
        AND ( ?3 IS NULL OR token_in = ?3 )
        AND ( ?4 IS NULL OR token_out = ?4 )
      ORDER BY created_at DESC
      LIMIT ?5 OFFSET ?6",
    )
    .bind(query.account_id.as_deref())
    .bind(query.hide_sent)
    .bind(query.token_in.as_deref())
    .bind(query.token_out.as_deref())
    .bind(query.limit)
    .bind(query.offset)
    .fetch_all(pool)
    .await?;

    let items = rows.iter().map(row_to_swap_queue_fun).collect();

    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(1)
       FROM swap_queue
      WHERE ( ?1 IS NULL
           OR EXISTS (SELECT 1 FROM swap_queue_accounts a
                       WHERE a.swap_id = swap_queue.swap_id
                         AND a.account_id = ?1) )
        AND ( ?2 IS NULL OR ?2 = 0
           OR NOT EXISTS (SELECT 1 FROM swap_queue_accounts s
                           WHERE s.swap_id = swap_queue.swap_id
                             AND s.account_id = ?1
                             AND s.tx_hash IS NOT NULL) )
        AND ( ?3 IS NULL OR token_in = ?3 )
        AND ( ?4 IS NULL OR token_out = ?4 )",
    )
    .bind(query.account_id.as_deref())
    .bind(query.hide_sent)
    .bind(query.token_in.as_deref())
    .bind(query.token_out.as_deref())
    .fetch_one(pool)
    .await?;

    Ok((items, total.0))
}

// ========================================
// --- UPDATE QUOTE ----------------------
// write the quote that was taken for a swap.
//
// --- WHY --- THE QUOTE IS WRITTEN BACK AND NOT ONLY READ: the feed asks
// the router for a live quote, and the live quote is a fact about this
// swap at this moment. keeping it means the next reader sees the last
// known quote even when the router is down.
//
// --- WHY --- THE QUOTE DOES NOT TOUCH `created_at`: the swap was queued
// when it was queued, and a later quote does not make it newer.
pub async fn swap_queue_set_quote_fun(
    pool: &SqlitePool,
    swap_id: &str,
    amount_out: &str,
    dex_id: Option<&str>,
) -> Result<u64, sqlx::Error> {
    let now = now_ms_fun();

    let result = sqlx::query(
        "UPDATE swap_queue
        SET amount_out = ?2,
            dex_id = ?3,
            updated_at = ?4
      WHERE swap_id = ?1",
    )
    .bind(swap_id)
    .bind(amount_out)
    .bind(dex_id)
    .bind(now)
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
}

// ========================================
// --- HELPERS ----------------------------
// turn a db row into a queued swap.
fn row_to_swap_queue_fun(row: &sqlx::sqlite::SqliteRow) -> SWAP_QUEUE_ROW {
    SWAP_QUEUE_ROW {
        swap_id: row.get("swap_id"),
        what: row.get("what"),
        when_text: row.get("when"),
        why: row.get("why"),
        when_at: row.get("when_at"),
        token_in: row.get("token_in"),
        amount_in: row.get("amount_in"),
        token_out: row.get("token_out"),
        amount_out: row.get("amount_out"),
        dex_id: row.get("dex_id"),
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
