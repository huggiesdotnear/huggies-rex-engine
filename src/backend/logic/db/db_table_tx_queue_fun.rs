// ========================================
// DB_TABLE_TX_QUEUE_FUN
// the tx_queue table: one row per queued BATCH of transactions.
//
// --- WHY --- a queue is a BATCH and not a single transaction: the agent
// queues a swap, and that swap needs three function calls — a deposit,
// the swap itself, and a withdrawal — so they go in together under one
// `queue_id`, and the user signs them as one batch, in one wallet popup.
//
// --- WHY --- the `what`, `when` and `why` live on the QUEUE and not on
// the transaction rows: they describe the batch, not one call. "swap 100
// USDC for NEAR" is the what of three calls taken together. on the
// transaction rows, three calls would carry three copies of the same
// sentence.
//
// --- WHY --- `what`, `when` and `why` are all nullable: the agent may
// know the what and not the why. an agent that had to fill all three
// would make one up, and a made-up why is worse than no why.
//
// --- WHY --- `when` is TEXT and `when_at` is a TIMESTAMP: most of the
// time "when" is a CONDITION and not a moment — "when the price is
// right", "after this proposal passes". a string can say that and a
// timestamp cannot. but some requests really are "at 10:00 on friday",
// and that needs a number the machine can sort on and the ui can count
// down to. so both: `when` is the human sentence, `when_at` is the
// optional machine time, and `when_at` is NULL when there is no moment.
//
// --- WHY --- there is NO status column here: a queue is never done. at
// any moment another account can decide they want to send it, and they
// join. the status lives on the account row and nowhere else.
use sqlx::{Connection, Executor, SqliteConnection};
// ========================================
// --- SCHEMA ----------------------------
// the statement that creates the table.
//
// --- WHY --- `CREATE TABLE IF NOT EXISTS`: it creates the table on a
// fresh db and does nothing on one that already has it.
//
// --- WHY --- there is NO index on `created_at` here: the feed list reads
// the queues newest first, and a queue's rows are few enough that the
// sort is over a small table. the index that matters is the one on the
// account rows, which is where the feed actually filters.
//
// --- WHY --- the `when` and `why` columns are QUOTED: `when` is a
// reserved word in sqlite, and an unquoted `when` in a column list is a
// syntax error. the quotes make the name the plain word `when` — the
// column is still called `when`, and `pragma_table_info` still reports
// it as `when`.
pub const SHIT_1170_DB_TABLE_TX_QUEUE: &str = r#"
  CREATE TABLE IF NOT EXISTS tx_queue (
    queue_id           TEXT    NOT NULL PRIMARY KEY,
    what               TEXT,
    "when"             TEXT,
    why                TEXT,
    when_at            INTEGER,
    created_at         INTEGER NOT NULL,
    updated_at         INTEGER NOT NULL
  );
"#;
// ========================================
// --- CREATE ----------------------------
// create the tx_queue table if it is not there yet.
//
// --- WHY --- it runs in a transaction: a half-created table would fail
// the first query against it.
//
// --- WHY --- it runs on every start: the statement does nothing when the
// table already exists, so there is no bookkeeping to say "already
// done" and no state to get out of step with the schema.
pub async fn db_table_tx_queue_create_fun(
    connection: &mut SqliteConnection,
) -> Result<(), sqlx::Error> {
    let mut transaction = connection.begin().await?;
    transaction.execute(SHIT_1170_DB_TABLE_TX_QUEUE).await?;
    transaction.commit().await?;
    Ok(())
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
