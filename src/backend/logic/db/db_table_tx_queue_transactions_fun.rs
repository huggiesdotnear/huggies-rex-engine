// ========================================
// DB_TABLE_TX_QUEUE_TRANSACTIONS_FUN
// the tx_queue_transactions table: one row per transaction inside a
// queued batch.
//
// --- WHY --- only FUNCTION CALLS can be queued: no transfers, no key
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
// time. `args` stays a json column because it is a bag of arbitrary keys
// with no shape — there is nothing to group by.
//
// --- WHY --- `position` is the order of the transactions: a batch of
// three calls has an order — the deposit comes first, the swap second,
// the withdrawal third — and `position` is that order, `0, 1, 2` within
// the queue.
//
// --- WHY --- `position` is a column and not the rowid: sqlite hands out
// rowids that depend on the insert order and the vacuum state.
// `position` is explicit, and it is what the wallet popup needs — the
// wallet gets the transactions in the order the agent wrote them.
//
// --- WHY --- `tx_id` is a uuid and not `queue_id` + `position`: the
// position is renumbered when a transaction is removed from the middle
// of the batch. a url that named a transaction by its position would then
// point at a different transaction. the uuid does not move.
//
// --- WHY --- `gas` and `deposit` are TEXT and nullable: the toolbox
// takes `number | string` for gas and `number | string | bigint` for
// deposit, and a big deposit does not fit a json number safely. as
// strings both fit, and a call that omits them has no gas of its own.
use sqlx::{Connection, Executor, SqliteConnection};
// ========================================
// --- SCHEMA ----------------------------
// the statement that creates the table and its indexes.
//
// --- WHY --- `CREATE TABLE IF NOT EXISTS`: it creates the table on a
// fresh db and does nothing on one that already has it.
//
// --- WHY --- the foreign key ON DELETE CASCADE: a transaction without a
// queue is nothing. deleting the queue takes its transactions with it,
// and the transactions take their account rows with them.
//
// --- WHY --- the four indexes, one each for the endpoint that needs it:
// `contract_id` serves "how many txs for this contract" and "the most
// common contracts", `method` serves "the most common methods",
// `queue_id` serves "the transactions of this queue, in order", and
// `created_at` serves the feed list, newest first.
pub const SHIT_1170_DB_TABLE_TX_QUEUE_TRANSACTIONS: &str = r#"
  CREATE TABLE IF NOT EXISTS tx_queue_transactions (
    tx_id              TEXT    NOT NULL PRIMARY KEY,
    queue_id           TEXT    NOT NULL,
    position           INTEGER NOT NULL,
    contract_id        TEXT    NOT NULL,
    method             TEXT    NOT NULL,
    args               TEXT    NOT NULL,
    gas                TEXT,
    deposit            TEXT,
    created_at         INTEGER NOT NULL,
    updated_at         INTEGER NOT NULL,
    FOREIGN KEY (queue_id) REFERENCES tx_queue (queue_id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS tx_queue_transactions_contract_id_idx
    ON tx_queue_transactions (contract_id);
  CREATE INDEX IF NOT EXISTS tx_queue_transactions_method_idx
    ON tx_queue_transactions (method);
  CREATE INDEX IF NOT EXISTS tx_queue_transactions_queue_id_idx
    ON tx_queue_transactions (queue_id);
  CREATE INDEX IF NOT EXISTS tx_queue_transactions_created_at_idx
    ON tx_queue_transactions (created_at);
"#;
// ========================================
// --- CREATE ----------------------------
// create the tx_queue_transactions table if it is not there yet.
//
// --- WHY --- it runs in a transaction: a half-created table would fail
// the first query against it.
//
// --- WHY --- it runs on every start: the statement does nothing when the
// table already exists, so there is no bookkeeping to say "already
// done" and no state to get out of step with the schema.
pub async fn db_table_tx_queue_transactions_create_fun(
    connection: &mut SqliteConnection,
) -> Result<(), sqlx::Error> {
    let mut transaction = connection.begin().await?;
    transaction
        .execute(SHIT_1170_DB_TABLE_TX_QUEUE_TRANSACTIONS)
        .await?;
    transaction.commit().await?;
    Ok(())
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
