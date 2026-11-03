// ========================================
// SESSIONS_STORE
// the db access for the sessions table. every read and every write of a
// session goes through this file, so the sql lives in one place.
//
// --- WHY --- one row per ACCOUNT and not per person: an account has
// exactly one session key, and the account id is the row's identity.
// signing in with the same account on another device finds the same row
// and hands back the same key.
//
// --- WHY --- there is no linking and no accounts list: an account
// belongs to itself. there is no question of which person an account
// belongs to, so there is nothing to merge and nothing to keep in
// agreement.
//
// --- WHY --- the session key is stored AS IT IS: the key can be handed
// back out on a later sign-in, so the db has to be able to produce it
// again, and the key is ours and the db is ours.
use sqlx::{Row, SqlitePool};
// ========================================
// --- TYPES ------------------------------
// one session, as it comes out of the db.
#[derive(Debug, Clone)]
pub struct SESSION_ROW {
    // the account the session belongs to. it is the row's primary key.
    pub account_id: String,
    // the session key.
    pub session_key: String,
    // the hash of the session key. a request is looked up by this.
    pub session_key_hash: String,
    // when the session was created, in ms since the epoch.
    pub created_at: i64,
    // when the session was last touched, in ms since the epoch.
    pub updated_at: i64,
}
// ========================================
// --- READ ------------------------------
// one session by its account id, or None.
pub async fn session_get_fun(
    pool: &SqlitePool,
    account_id: &str,
) -> Result<Option<SESSION_ROW>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT account_id, session_key, session_key_hash, created_at, updated_at
       FROM sessions
      WHERE account_id = ?1",
    )
    .bind(account_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| row_to_session_fun(&row)))
}

// one session by its session key hash, or None.
//
// --- WHY --- the lookup is by the HASH: a request arrives carrying the
// real key, it is hashed, and the hash is what is looked up. the real key
// is never compared against anything in the db, and no row is decrypted
// to find the match.
pub async fn session_get_by_key_hash_fun(
    pool: &SqlitePool,
    session_key_hash: &str,
) -> Result<Option<SESSION_ROW>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT account_id, session_key, session_key_hash, created_at, updated_at
       FROM sessions
      WHERE session_key_hash = ?1",
    )
    .bind(session_key_hash)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| row_to_session_fun(&row)))
}

// every account that has a session, in insertion order.
pub async fn session_list_account_ids_fun(pool: &SqlitePool) -> Result<Vec<String>, sqlx::Error> {
    let rows = sqlx::query("SELECT account_id FROM sessions ORDER BY created_at ASC")
        .fetch_all(pool)
        .await?;
    Ok(rows.iter().map(|row| row.get("account_id")).collect())
}
// ========================================
// --- WRITE -----------------------------
// create the session for an account, or return the one that already
// exists.
//
// --- WHY --- this is one statement and not a select-then-insert: two
// sign-ins for the same account at the same moment would both see "no
// row" and both insert, and the second insert would fail on the primary
// key. the upsert keeps exactly one row per account no matter how many
// devices sign in at once.
//
// --- WHY --- the session key is NOT replaced on a later sign-in: an
// account has one key, and signing in on a second device must hand back
// the key the first device already has. so the key columns are only
// written when the row is created — the conflict branch only refreshes
// the timestamp.
pub async fn session_upsert_fun(
    pool: &SqlitePool,
    account_id: &str,
    session_key: &str,
    session_key_hash: &str,
) -> Result<SESSION_ROW, sqlx::Error> {
    let now = now_ms_fun();

    sqlx::query(
        "INSERT INTO sessions
       (account_id, session_key, session_key_hash, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?4)
     ON CONFLICT (account_id) DO UPDATE SET
       updated_at = excluded.updated_at",
    )
    .bind(account_id)
    .bind(session_key)
    .bind(session_key_hash)
    .bind(now)
    .execute(pool)
    .await?;

    session_get_fun(pool, account_id)
        .await?
        .ok_or(sqlx::Error::RowNotFound)
}

// ========================================
// --- ROTATE ----------------------------
// replace an account's session key with a new one.
//
// --- WHY --- this is a separate statement and not an upsert: a rotate
// has to REPLACE the key, and the upsert deliberately never replaces it.
// a rotate that did not change the key would be a no-op that still told
// the reader their key had been rotated.
//
// --- WHY --- the new key's hash goes in with it: a request is looked up
// by the hash, so a rotated key that kept the old hash would still be
// found by the old key — which is exactly what a rotation must stop.
pub async fn session_rotate_fun(
    pool: &SqlitePool,
    account_id: &str,
    session_key: &str,
    session_key_hash: &str,
) -> Result<SESSION_ROW, sqlx::Error> {
    let now = now_ms_fun();

    let result = sqlx::query(
        "UPDATE sessions
        SET session_key = ?2, session_key_hash = ?3, updated_at = ?4
      WHERE account_id = ?1",
    )
    .bind(account_id)
    .bind(session_key)
    .bind(session_key_hash)
    .bind(now)
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(sqlx::Error::RowNotFound);
    }

    session_get_fun(pool, account_id)
        .await?
        .ok_or(sqlx::Error::RowNotFound)
}
// ========================================
// --- HELPERS ----------------------------
// turn a db row into a session.
fn row_to_session_fun(row: &sqlx::sqlite::SqliteRow) -> SESSION_ROW {
    SESSION_ROW {
        account_id: row.get("account_id"),
        session_key: row.get("session_key"),
        session_key_hash: row.get("session_key_hash"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

// the current time in ms since the epoch.
pub fn now_ms_fun() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis() as i64)
        .unwrap_or(0)
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
