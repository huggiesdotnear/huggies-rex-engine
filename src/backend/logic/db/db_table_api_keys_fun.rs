// ========================================
// DB_TABLE_API_KEYS_FUN
// the api_keys table: the api keys the users hold.
//
// --- WHY --- this table was called `sessions` and is now called
// `api_keys`: the credential in it is not a browser session. the user
// signs in once and hands the key to an agent, and the agent holds it as
// a bearer token for as long as it lives. a "session" describes the
// browser's short use of it; an "api key" describes what it actually is.
// the table's name is the first place that word is said out loud.
//
// --- WHY --- one row per ACCOUNT and not per person: an account has
// exactly one api key, so the account id IS the row's identity. there is
// no linking between accounts and no list to keep in agreement.
//
// --- WHY --- `api_key_hash` is there beside `api_key`: a request is
// looked up by the hash, so the read path never touches the key itself.
//
// --- WHY --- `created_at` and `updated_at` are millisecond timestamps as
// integers, not strings: they sort and compare as numbers, and sqlite
// has no date type.
use sqlx::{Connection, Executor, SqliteConnection};
// ========================================
// --- SCHEMA ----------------------------
// the statement that creates the table and its index.
//
// --- WHY --- `CREATE TABLE IF NOT EXISTS`: it creates the table on a
// fresh db and does nothing on one that already has it. that is the
// whole job.
//
// --- WHY --- the index on `api_key_hash` is UNIQUE: every authenticated
// request looks a key up by its hash, and two rows with the same hash
// would mean two accounts behind one credential. the uniqueness is the
// security property, and the index is what makes the lookup cheap.
pub const SHIT_1170_DB_TABLE_API_KEYS: &str = r#"
  CREATE TABLE IF NOT EXISTS api_keys (
    account_id         TEXT    NOT NULL PRIMARY KEY,
    api_key            TEXT    NOT NULL,
    api_key_hash       TEXT    NOT NULL,
    created_at         INTEGER NOT NULL,
    updated_at         INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS api_keys_api_key_hash_idx
    ON api_keys (api_key_hash);
"#;
// ========================================
// --- CREATE ----------------------------
// create the api_keys table if it is not there yet.
//
// --- WHY --- it runs in a transaction: a half-created table would fail
// the first query against it.
//
// --- WHY --- it runs on every start: the statement does nothing when the
// table already exists, so there is no bookkeeping to say "already
// done" and no state to get out of step with the schema.
pub async fn db_table_api_keys_create_fun(
    connection: &mut SqliteConnection,
) -> Result<(), sqlx::Error> {
    let mut transaction = connection.begin().await?;
    transaction.execute(SHIT_1170_DB_TABLE_API_KEYS).await?;
    transaction.commit().await?;
    Ok(())
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
