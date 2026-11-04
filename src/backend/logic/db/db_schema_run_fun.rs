// ========================================
// DB_SCHEMA_RUN_FUN
// runs the table creates: the one file that knows how many tables there
// are.
//
// --- WHY --- there is NO migration system here. a migration system exists
// so a db's schema can be CHANGED over time: each change is a numbered
// step, the db records which steps it has run, and a fresh db runs them
// all in order.
//
// this db has four tables of its own and four settled shapes for them.
// so there is nothing to step through and nothing to remember. what is
// left is the schema itself and the statements that create it.
//
// --- WHY --- the tables are NOT versioned per row: a `format_version`
// column would let a new shape be written beside an old one and the old
// one ignored. that is worth doing when a shape changes often enough
// for the old rows to pile up, and it is not worth doing for tables whose
// shapes are settled. a changed shape means changing the table file.
//
// --- WHY --- the schema lives in code and not in a folder of .sql files:
// the schema has to travel with the binary. a file the docker image does
// not carry is a file the app cannot open.
//
// --- WHY --- the tables are created in DEPENDENCY ORDER: `tx_queue` has
// to exist before `tx_queue_transactions` points at it, and
// `tx_queue_transactions` has to exist before `tx_queue_accounts` points
// at it. sqlite does not check a foreign key's target when the table is
// created, but the order still has to be right for the rows that follow
// and for a reader of the code.
//
// --- WHY --- each table file holds its own `CREATE TABLE` and its own
// indexes, and this file holds nothing but the order: a table's shape is
// read in one place, and this is the only file that says how many tables
// there are.
use sqlx::{Connection, Executor, SqliteConnection};
// ========================================
// --- RUN -------------------------------
// create every table if it is not there yet.
//
// --- WHY --- it runs on every start: the statements do nothing when the
// tables already exist, so there is no bookkeeping to say "already done"
// and no state to get out of step with the schema.
//
// --- WHY --- it runs in ONE transaction: a half-created schema would fail
// the first query against it. one transaction means either every table is
// there or none of them is.
//
// --- WHY --- the table creates are called with the SAME connection and
// NOT in a nested transaction of their own: a transaction cannot be
// started inside another transaction. so the table files expose their
// statement as a constant and the runner executes them itself.
pub async fn db_schema_run_fun(connection: &mut SqliteConnection) -> Result<(), sqlx::Error> {
    use crate::backend::logic::db::db_table_api_keys_fun::SHIT_1170_DB_TABLE_API_KEYS;
    use crate::backend::logic::db::db_table_tx_queue_accounts_fun::SHIT_1170_DB_TABLE_TX_QUEUE_ACCOUNTS;
    use crate::backend::logic::db::db_table_tx_queue_fun::SHIT_1170_DB_TABLE_TX_QUEUE;
    use crate::backend::logic::db::db_table_tx_queue_transactions_fun::SHIT_1170_DB_TABLE_TX_QUEUE_TRANSACTIONS;

    let mut transaction = connection.begin().await?;

    // the api keys. no foreign keys point at it, so it goes first.
    transaction.execute(SHIT_1170_DB_TABLE_API_KEYS).await?;

    // the queue. the transactions point at it.
    transaction.execute(SHIT_1170_DB_TABLE_TX_QUEUE).await?;

    // the transactions of a queue. the account rows point at them.
    transaction
        .execute(SHIT_1170_DB_TABLE_TX_QUEUE_TRANSACTIONS)
        .await?;

    // the account rows. they point at the transactions.
    transaction
        .execute(SHIT_1170_DB_TABLE_TX_QUEUE_ACCOUNTS)
        .await?;

    transaction.commit().await?;
    Ok(())
}
// ========================================
// --- RUN ON A POOL ----------------------
// the same schema, over a pool connection.
//
// --- WHY --- the pool's connection is a different type than a plain
// SqliteConnection, and this code should not care which one it was
// handed.
pub async fn db_schema_run_pool_fun(pool: &sqlx::SqlitePool) -> Result<(), sqlx::Error> {
    let mut connection = pool.acquire().await?;
    db_schema_run_fun(&mut connection).await
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
