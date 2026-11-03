// ========================================
// DB_OPEN_FUN
// the sqlite pool: the one place the backend touches the database.
//
// --- WHY --- a pool and not one connection: sqlite allows exactly one
// writer at a time, so the pool is small and the writes are serialized by
// sqlx's own busy timeout. more than one connection lets a read run while
// a write is in flight, which is the whole point of having a pool.
//
// --- WHY --- the schema is created at startup: a fresh db has no tables,
// and the first query against a missing table would fail. the statement
// does nothing on a db that already has them.
//
// --- WHY --- the pool is built ONCE, at startup, and handed to the routes
// as state. opening a pool per request would open a file handle per
// request and would make every route responsible for closing it.
//
// --- WHY --- WAL mode: the app's reads (the skill page's card) and its
// writes (a sign-in creating a session) overlap. WAL lets the reader
// keep reading while the writer writes, instead of the reader blocking
// behind the write.
//
// --- WHY --- `foreign_keys` is ON: sqlite has it off by default, and a
// table added later that points at another one would silently not be
// enforced.
//
// --- WHY --- `busy_timeout` is set: a write that arrives while another
// write holds the lock waits this long instead of failing immediately
// with "database is locked".
// ========================================
use sqlx::SqlitePool;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use std::path::Path;
use std::time::Duration;
// ========================================
// --- CONFIG -----------------------------
// how many connections the pool may hold.
//
// --- WHY --- it is small: sqlite serializes writes anyway, and this app
// has a handful of users. a big pool would only add lock contention.
const SHIT_1170_DB_MAX_CONNECTIONS: u32 = 5;
// how long a connection waits for the pool to hand it out.
const SHIT_1170_DB_ACQUIRE_TIMEOUT: Duration = Duration::from_secs(10);
// how long a statement waits for the write lock before giving up.
const SHIT_1170_DB_BUSY_TIMEOUT: Duration = Duration::from_secs(5);
// ========================================
// --- OPEN -------------------------------
// open the pool at the db file's path and bring the schema up to date.
//
// --- WHY --- the parent folder is created first: a fresh install has no
// `${HOME}/.shit-1170/` yet, and sqlite cannot create it.
pub async fn db_open_fun(path: &Path) -> Result<SqlitePool, sqlx::Error> {
    if let Some(parent) = path.parent()
        && !parent.as_os_str().is_empty()
    {
        tokio::fs::create_dir_all(parent).await?;
    }

    let options = SqliteConnectOptions::new()
        .filename(path)
        // the file has to exist before the connect options are built for a
        // path, and create_if_missing does that on connect.
        .create_if_missing(true)
        // WAL: readers keep reading while a writer writes.
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        // sqlite leaves foreign keys off by default.
        .foreign_keys(true)
        // a write that finds the lock taken waits here instead of failing.
        .busy_timeout(SHIT_1170_DB_BUSY_TIMEOUT);

    let pool = SqlitePoolOptions::new()
        .max_connections(SHIT_1170_DB_MAX_CONNECTIONS)
        .acquire_timeout(SHIT_1170_DB_ACQUIRE_TIMEOUT)
        .connect_with(options)
        .await?;

    crate::backend::logic::db::db_schema::db_schema_create_pool_fun(&pool).await?;

    Ok(pool)
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
