// ========================================
// DB_TABLE_TX_QUEUE_ACCOUNTS_FUN
// the tx_queue_accounts table: one row per account, per transaction.
// this is the WHO of a queued batch.
//
// --- WHY --- the WHO is a TABLE and not a json array: each object in
// the array is one row, and the three fields of the object are three
// columns — `account_id`, `status` and `tx_hash`. the array read on the
// wire is those rows serialized back to a list. nothing is added and
// nothing is lost.
//
// --- WHY --- the account row hangs off the TRANSACTION and not off the
// QUEUE: a queue has three transactions, the user signs all three
// together, and EACH transaction produces its OWN hash. the hash cannot
// live on the account row of the queue, or three hashes would collide in
// one column.
//
// --- WHY --- the primary key is `(tx_id, account_id)` and not
// `(queue_id, tx_id, account_id)`: the account row is about one
// transaction. the `queue_id` is kept as a column anyway, so a query for
// "every account on this queue" is one indexed read with no join through
// the transactions table.
//
// --- WHY --- `status` lives ONLY here: the one place where the truth
// is. a transaction is not "sent" or "failed" on its own — it is sent BY
// an account, and each account's send is its own transaction with its own
// hash and its own outcome. two accounts sending the same queued
// transaction produce two different on-chain transactions, and either can
// succeed while the other fails.
//
// --- WHY --- the four states: `pending` is on the queue and not signed
// yet, `sent` is signed and sent but the outcome is not known yet,
// `succeeded` is it went through, and `failed` is it did not work.
//
// --- WHY --- `tx_hash` is NULL until somebody sends: the hash is the
// fact. a row with a hash is history — it shows who did the tx and it
// stays.
//
// --- WHY --- the foreign key ON DELETE CASCADE: an account row without
// its transaction is nothing. deleting the transaction takes its account
// rows with it.
use sqlx::{Connection, Executor, SqliteConnection};
// ========================================
// --- SCHEMA ----------------------------
// the statement that creates the table and its indexes.
//
// --- WHY --- `CREATE TABLE IF NOT EXISTS`: it creates the table on a
// fresh db and does nothing on one that already has it.
//
// --- WHY --- the three indexes, one each for the query that needs it:
// `account_id` serves "the txs for THIS account" — the feed filter,
// `queue_id` serves "the accounts on this queue", and `status` serves
// "the txs this account has not sent yet".
pub const SHIT_1170_DB_TABLE_TX_QUEUE_ACCOUNTS: &str = r#"
  CREATE TABLE IF NOT EXISTS tx_queue_accounts (
    queue_id           TEXT    NOT NULL,
    tx_id              TEXT    NOT NULL,
    account_id         TEXT    NOT NULL,
    status             TEXT    NOT NULL DEFAULT 'pending',
    tx_hash            TEXT,
    created_at         INTEGER NOT NULL,
    updated_at         INTEGER NOT NULL,
    PRIMARY KEY (tx_id, account_id),
    FOREIGN KEY (tx_id) REFERENCES tx_queue_transactions (tx_id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS tx_queue_accounts_account_id_idx
    ON tx_queue_accounts (account_id);
  CREATE INDEX IF NOT EXISTS tx_queue_accounts_queue_id_idx
    ON tx_queue_accounts (queue_id);
  CREATE INDEX IF NOT EXISTS tx_queue_accounts_status_idx
    ON tx_queue_accounts (status);
"#;
// ========================================
// --- CREATE ----------------------------
// create the tx_queue_accounts table if it is not there yet.
//
// --- WHY --- it runs in a transaction: a half-created table would fail
// the first query against it.
//
// --- WHY --- it runs on every start: the statement does nothing when the
// table already exists, so there is no bookkeeping to say "already
// done" and no state to get out of step with the schema.
pub async fn db_table_tx_queue_accounts_create_fun(
    connection: &mut SqliteConnection,
) -> Result<(), sqlx::Error> {
    let mut transaction = connection.begin().await?;
    transaction
        .execute(SHIT_1170_DB_TABLE_TX_QUEUE_ACCOUNTS)
        .await?;
    transaction.commit().await?;
    Ok(())
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
