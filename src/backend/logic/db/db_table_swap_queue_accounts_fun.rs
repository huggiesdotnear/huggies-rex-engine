// ========================================
// DB_TABLE_SWAP_QUEUE_ACCOUNTS_FUN
// the swap_queue_accounts table: one row per account, per queued swap.
// this is the WHO of a queued swap.
//
// --- WHY --- the WHO is a TABLE and not a json array: each object in
// the array is one row, and the fields of the object are columns. the
// array read on the wire is those rows serialized back to a list.
//
// --- WHY --- the status lives ONLY here: the one place where the truth
// is. a swap is not "sent" or "failed" on its own — it is sent BY an
// account, and each account's send is its own transaction with its own
// hash and its own outcome. two accounts sending the same queued swap
// produce two different on-chain transactions, and either can succeed
// while the other fails.
//
// --- WHY --- the four states: `pending` is on the queue and not signed
// yet, `sent` is signed and sent but the outcome is not known yet,
// `succeeded` is it went through, and `failed` is it did not work.
//
// --- WHY --- `amount_out` is HERE and not on the swap row: the amount
// that came out belongs to the send. two accounts sending the same
// queued swap get two different amounts out — the pools moved between
// the two sends — so the amount sits on the row that says who sent it.
//
// --- WHY --- `tx_hash` is NULL until somebody sends: the hash is the
// fact. a row with a hash is history — it shows who did the swap and it
// stays.
//
// --- WHY --- the foreign key ON DELETE CASCADE: an account row without
// its swap is nothing. deleting the swap takes its account rows with it.
use sqlx::{Connection, Executor, SqliteConnection};
// ========================================
// --- SCHEMA ----------------------------
// the statement that creates the table and its indexes.
//
// --- WHY --- `CREATE TABLE IF NOT EXISTS`: it creates the table on a
// fresh db and does nothing on one that already has it.
//
// --- WHY --- the three indexes, one each for the query that needs it:
// `account_id` serves "the swaps for THIS account" — the feed filter,
// `swap_id` serves "the accounts on this swap", and `status` serves
// "the swaps this account has not sent yet".
pub const SHIT_1170_DB_TABLE_SWAP_QUEUE_ACCOUNTS: &str = r#"
  CREATE TABLE IF NOT EXISTS swap_queue_accounts (
    swap_id            TEXT    NOT NULL,
    account_id         TEXT    NOT NULL,
    status             TEXT    NOT NULL DEFAULT 'pending',
    tx_hash            TEXT,
    amount_out         TEXT,
    created_at         INTEGER NOT NULL,
    updated_at         INTEGER NOT NULL,
    PRIMARY KEY (swap_id, account_id),
    FOREIGN KEY (swap_id) REFERENCES swap_queue (swap_id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS swap_queue_accounts_account_id_idx
    ON swap_queue_accounts (account_id);
  CREATE INDEX IF NOT EXISTS swap_queue_accounts_swap_id_idx
    ON swap_queue_accounts (swap_id);
  CREATE INDEX IF NOT EXISTS swap_queue_accounts_status_idx
    ON swap_queue_accounts (status);
"#;
// ========================================
// --- CREATE ----------------------------
// create the swap_queue_accounts table if it is not there yet.
//
// --- WHY --- it runs in a transaction: a half-created table would fail
// the first query against it.
//
// --- WHY --- it runs on every start: the statement does nothing when the
// table already exists, so there is no bookkeeping to say "already
// done" and no state to get out of step with the schema.
pub async fn db_table_swap_queue_accounts_create_fun(
    connection: &mut SqliteConnection,
) -> Result<(), sqlx::Error> {
    let mut transaction = connection.begin().await?;
    transaction
        .execute(SHIT_1170_DB_TABLE_SWAP_QUEUE_ACCOUNTS)
        .await?;
    transaction.commit().await?;
    Ok(())
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
