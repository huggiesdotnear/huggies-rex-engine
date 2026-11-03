// ========================================
// MIGRATIONS
// the db's schema, as ordered migrations.
//
// --- WHY --- the schema lives in code and not in a folder of .sql files:
// the migrations are the db's history, and the history has to travel with
// the binary. a `sqlx::migrate!` folder needs the files at compile time
// and at runtime, which means the docker image has to carry them — and a
// half-copied folder fails at startup instead of failing loudly.
//
// --- WHY --- each migration runs ONCE, inside a transaction, and its id
// is recorded in `_sqlx_migrations`. sqlx does that bookkeeping itself, so
// a restart does not re-run a migration and a fresh db gets every one.
//
// --- WHY --- the migrations are APPEND-ONLY: a new migration appends,
// and an existing one is never edited. editing one that already ran on a
// live db leaves that db on the old schema and the code on the new one.
//
// --- WHY --- the ids are the migration names, and the names say what the
// migration DOES, not when it was written. a numbered name (`0001_init`)
// forces every future author to remember the number; a named one reads
// as what it is.
//
// --- WHY --- THERE IS ONLY ONE MIGRATION HERE. a migration that is no
// longer needed is DELETED, not kept: the db records the ones it has
// run, so a deleted migration simply never runs again, and the code
// carries only the schema that exists today. a migration kept "just in
// case" is code for a schema nobody has any more.
// ========================================
use sqlx::{Connection, Executor, SqliteConnection};
// ========================================
// --- MIGRATION -------------------------
// one migration: its name and its sql.
struct HUGGIES_MIGRATION {
    name: &'static str,
    sql: &'static str,
}
// ========================================
// --- MIGRATIONS ------------------------
// the list, in the order they run.
const HUGGIES_MIGRATIONS: &[HUGGIES_MIGRATION] = &[HUGGIES_MIGRATION {
    name: "sessions_table",
    sql: r#"
  CREATE TABLE IF NOT EXISTS sessions (
    account_id         TEXT    NOT NULL PRIMARY KEY,
    session_key        TEXT    NOT NULL,
    session_key_hash   TEXT    NOT NULL,
    created_at         INTEGER NOT NULL,
    updated_at         INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS sessions_session_key_hash_idx
    ON sessions (session_key_hash);
  "#,
}];
// ========================================
// --- MIGRATE ----------------------------
// bring the db up to the latest schema.
//
// --- WHY --- each migration gets its OWN transaction, and the
// migration's bookkeeping row is written in the same transaction as the
// migration itself. so a migration either lands completely or not at
// all, and a db that was killed mid-migration comes back with that
// migration still pending rather than half applied.
pub async fn migrate_fun(connection: &mut SqliteConnection) -> Result<(), sqlx::Error> {
    // the bookkeeping table sqlx uses to remember which migrations ran.
    // it is created here rather than as a migration of its own, because
    // sqlx needs it to exist before it can track anything.
    connection
        .execute(
            "CREATE TABLE IF NOT EXISTS _sqlx_migrations (
        version    TEXT    NOT NULL PRIMARY KEY,
        description TEXT   NOT NULL,
        installed_on TEXT NOT NULL DEFAULT (datetime('now')),
        success    INTEGER NOT NULL,
        checksum   BLOB    NOT NULL,
        execution_time INTEGER NOT NULL
      )",
        )
        .await?;

    for migration in HUGGIES_MIGRATIONS {
        if migration_already_ran_fun(connection, migration.name).await? {
            continue;
        }
        // the whole migration in one transaction: the schema change and
        // the record that it happened.
        let mut transaction = connection.begin().await?;
        transaction.execute(migration.sql).await?;
        sqlx::query(
            "INSERT INTO _sqlx_migrations
        (version, description, installed_on, success, checksum, execution_time)
       VALUES (?1, ?2, datetime('now'), 1, ?3, 0)",
        )
        .bind(migration.name)
        .bind(migration.name)
        .bind(checksum_for_fun(migration.sql.as_bytes()))
        .execute(&mut *transaction)
        .await?;
        transaction.commit().await?;
    }
    Ok(())
}
// ========================================
// --- MIGRATE ON A POOL ------------------
// the same migrations, run over a pool connection.
//
// --- WHY --- the pool's connection is a different type than a plain
// SqliteConnection, and the migration code should not care which one it
// was handed. so the migration body is written against a generic
// connection and both entry points call it.
pub async fn migrate_pool_fun(pool: &sqlx::SqlitePool) -> Result<(), sqlx::Error> {
    let mut connection = pool.acquire().await?;
    migrate_fun(&mut connection).await
}
// ========================================
// --- HELPERS ----------------------------
// has this migration already run on this db?
async fn migration_already_ran_fun(
    connection: &mut SqliteConnection,
    name: &str,
) -> Result<bool, sqlx::Error> {
    let row: Option<(i64,)> =
        sqlx::query_as("SELECT COUNT(1) FROM _sqlx_migrations WHERE version = ?1 AND success = 1")
            .bind(name)
            .fetch_optional(connection)
            .await?;
    Ok(row.map(|(count,)| count > 0).unwrap_or(false))
}

// a checksum of the migration's sql, so a db whose migration file was
// edited after it ran is visible instead of silently diverging.
//
// --- WHY --- a simple FNV-1a and not sha256: this is not a security
// boundary, it only has to notice that the sql changed. a hash crate
// for that would be a dependency with no other use.
fn checksum_for_fun(sql: &[u8]) -> Vec<u8> {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for byte in sql {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    hash.to_be_bytes().to_vec()
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
