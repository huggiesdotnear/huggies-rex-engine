// ========================================
// DB_SCHEMA
// the db's tables, and the one statement that creates them.
//
// --- WHY --- there is NO migration system here. a migration system
// exists so a db's schema can be CHANGED over time: each change is a
// numbered step, the db records which steps it has run, and a fresh db
// runs them all in order.
//
// this db has one table and one shape for it. so there is nothing to
// step through and nothing to remember. what is left is the schema
// itself and the statement that creates it.
//
// --- WHY --- the statement is `CREATE TABLE IF NOT EXISTS`: it creates
// the table on a fresh db and does nothing on one that already has it.
// that is the whole job.
//
// --- WHY --- the tables are NOT versioned per row: a `format_version`
// column would let a new shape be written beside an old one and the old
// one ignored. that is worth doing when a shape changes often enough
// for the old rows to pile up, and it is not worth doing for one table
// whose shape is settled. a changed shape means changing this file.
//
// --- WHY --- the schema lives in code and not in a folder of .sql files:
// the schema has to travel with the binary. a file the docker image
// does not carry is a file the app cannot open.
use sqlx::{Connection, Executor, SqliteConnection};
// ========================================
// --- SCHEMA ----------------------------
// the statements that create the tables.
//
// --- WHY --- the accounts table is keyed by the ACCOUNT id and not by a
// "user" that holds a list of accounts: an account has exactly one
// session key, so the account id IS the row's identity. there is no
// linking between accounts and no list to keep in agreement.
//
// --- WHY --- `session_key_hash` is there beside `session_key`: a request
// is looked up by the hash, so the read path never touches the key
// itself.
//
// --- WHY --- `created_at` and `updated_at` are millisecond timestamps as
// integers, not strings: they sort and compare as numbers, and sqlite
// has no date type.
const HUGGIES_DB_SCHEMA: &str = r#"
  CREATE TABLE IF NOT EXISTS sessions (
    account_id         TEXT    NOT NULL PRIMARY KEY,
    session_key        TEXT    NOT NULL,
    session_key_hash   TEXT    NOT NULL,
    created_at         INTEGER NOT NULL,
    updated_at         INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS sessions_session_key_hash_idx
    ON sessions (session_key_hash);
"#;
// ========================================
// --- CREATE ----------------------------
// create the tables if they are not there yet.
//
// --- WHY --- it runs on every start: the statement does nothing when the
// tables already exist, so there is no bookkeeping to say "already
// done" and no state to get out of step with the schema.
//
// --- WHY --- it runs in a transaction: a half-created schema would fail
// the first query against it.
pub async fn db_schema_create_fun(connection: &mut SqliteConnection) -> Result<(), sqlx::Error> {
    let mut transaction = connection.begin().await?;
    transaction.execute(HUGGIES_DB_SCHEMA).await?;
    transaction.commit().await?;
    Ok(())
}
// ========================================
// --- CREATE ON A POOL ------------------
// the same schema, over a pool connection.
//
// --- WHY --- the pool's connection is a different type than a plain
// SqliteConnection, and this code should not care which one it was
// handed.
pub async fn db_schema_create_pool_fun(pool: &sqlx::SqlitePool) -> Result<(), sqlx::Error> {
    let mut connection = pool.acquire().await?;
    db_schema_create_fun(&mut connection).await
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
