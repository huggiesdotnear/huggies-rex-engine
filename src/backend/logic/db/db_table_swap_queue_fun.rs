// ========================================
// DB_TABLE_SWAP_QUEUE_FUN
// the swap_queue table: one row per queued SWAP.
//
// --- WHY --- a queued swap is NOT a queued batch of transactions: the
// agent does not know the route. it knows the token in, the amount in
// and the token out — three facts — and the ROUTE is worked out at the
// moment somebody executes it. so the row holds the three facts and the
// quote, and the transactions only exist once the reader signs them.
//
// --- WHY --- the quote is stored ON THE ROW: the feed shows an amount
// out before anybody executes the swap, and the router is asked for a
// live quote on the feed page. but the router can be down, and a feed
// of swaps with no numbers in them is useless. so the quote that was
// taken when the swap was queued is kept, and the live quote falls back
// to it.
//
// --- WHY --- `amount_in` is the RAW unit amount and not a human amount:
// the chain and the router trade the token's smallest unit, and a
// human amount is only meaningful next to the token it belongs to. the
// raw number means the same thing whatever the token's decimals are.
//
// --- WHY --- the amount columns are TEXT and not INTEGER: the amounts
// can be far past what an i64 holds, and they travel as strings on the
// wire too. a number that overflows is a number that cannot be a swap.
//
// --- WHY --- there is NO status column here: a queued swap is never
// done. at any moment another account can decide they want it, and they
// join. the status lives on the account row and nowhere else — the same
// rule the tx queue keeps.
//
// --- WHY --- `dex_id` is nullable: the quote the agent took may name no
// dex, and the best route is worked out live anyway. it is the dex the
// QUOTE came from, not the dex the swap will use.
use sqlx::{Connection, Executor, SqliteConnection};
// ========================================
// --- SCHEMA ----------------------------
// the statement that creates the table.
//
// --- WHY --- `CREATE TABLE IF NOT EXISTS`: it creates the table on a
// fresh db and does nothing on one that already has it.
//
// --- WHY --- there IS an index on `created_at` now: the feed list reads
// the swaps newest first, and it used to do that over a table with no
// index on the column it sorts by — so every page of the feed sorted
// the WHOLE table before it took its hundred rows. a swap table is
// small while the app is young and is NOT small once a few thousand
// swaps are queued, and the feed is exactly the query that pays for it.
//
// --- WHY --- the index is on `(created_at, swap_id)` AND NOT JUST
// `created_at`: the feed's order is `(created_at DESC, swap_id DESC)`
// and the cursor walks it, and an index that carries both columns lets
// sqlite walk the pages in order without sorting anything.
//
// --- WHY --- the `when` column is QUOTED: `when` is a reserved word in
// sqlite, and an unquoted `when` in a column list is a syntax error.
// the quotes make the name the plain word `when` — the column is still
// called `when`, and `pragma_table_info` still reports it as `when`.
pub const SHIT_1170_DB_TABLE_SWAP_QUEUE: &str = r#"
  CREATE TABLE IF NOT EXISTS swap_queue (
    swap_id             TEXT    NOT NULL PRIMARY KEY,
    what               TEXT,
    "when"             TEXT,
    why                TEXT,
    when_at            INTEGER,
    token_in           TEXT    NOT NULL,
    amount_in          TEXT    NOT NULL,
    token_out          TEXT    NOT NULL,
    amount_out         TEXT,
    dex_id             TEXT,
    created_at         INTEGER NOT NULL,
    updated_at         INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS swap_queue_created_at_idx
    ON swap_queue (created_at DESC, swap_id DESC);
"#;
// ========================================
// --- CREATE ----------------------------
// create the swap_queue table if it is not there yet.
//
// --- WHY --- it runs in a transaction: a half-created table would fail
// the first query against it.
//
// --- WHY --- it runs on every start: the statement does nothing when the
// table already exists, so there is no bookkeeping to say "already
// done" and no state to get out of step with the schema.
pub async fn db_table_swap_queue_create_fun(
    connection: &mut SqliteConnection,
) -> Result<(), sqlx::Error> {
    let mut transaction = connection.begin().await?;
    transaction.execute(SHIT_1170_DB_TABLE_SWAP_QUEUE).await?;
    transaction.commit().await?;
    Ok(())
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
