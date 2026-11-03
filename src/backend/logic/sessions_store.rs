// ========================================
// SESSIONS_STORE
// the db access for the sessions table. every read and every write of a
// session goes through this file, so the sql lives in one place.
//
// --- WHY --- the session key is stored ENCRYPTED: the user has exactly
// one key, ever, and signing in on a second device has to hand back the
// SAME key. the db therefore has to be able to produce the key again, so
// a plain hash is not enough — a hash can verify a key but it cannot
// return one. see session_key_fun for the encryption.
//
// --- WHY --- the row is keyed by user_id and NOT by the session key:
// a user has exactly ONE session key, so the key follows the user. a
// sign-in from another device finds the row by user_id and returns the
// SAME key.
//
// --- WHY --- the accounts column is a json array: one user can hold
// several signed-in accounts, and they are read and written together.
use sqlx::{Row, SqlitePool};
// ========================================
// --- TYPES ------------------------------
// one session, as it comes out of the db.
#[derive(Debug, Clone)]
pub struct SESSION_ROW {
    // the user the session belongs to. it is the NEAR account id of the
    // account that signed in FIRST, and it is the row's primary key.
    pub user_id: String,
    // the session key, encrypted. decrypt it to get the real key.
    pub session_key_encrypted: String,
    // the hash of the session key. a request is looked up by this.
    pub session_key_hash: String,
    // the accounts this user holds signed in, as account ids.
    pub accounts: Vec<String>,
    // when the session was created, in ms since the epoch.
    pub created_at: i64,
    // when the session was last touched, in ms since the epoch.
    pub updated_at: i64,
}
// ========================================
// --- READ ------------------------------
// one session by its user id, or None.
pub async fn session_get_fun(
    pool: &SqlitePool,
    user_id: &str,
) -> Result<Option<SESSION_ROW>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT user_id, session_key, session_key_hash, accounts, created_at, updated_at
       FROM sessions
      WHERE user_id = ?1",
    )
    .bind(user_id)
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
        "SELECT user_id, session_key, session_key_hash, accounts, created_at, updated_at
       FROM sessions
      WHERE session_key_hash = ?1",
    )
    .bind(session_key_hash)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| row_to_session_fun(&row)))
}

// ========================================
// --- WRITE -----------------------------
// create the session for a user, or refresh the one that already exists.
//
// --- WHY --- this is one statement and not a select-then-insert: two
// sign-ins for the same user at the same moment would both see "no row"
// and both insert, and the second insert would fail on the primary key.
// the upsert keeps exactly one row per user no matter how many devices
// sign in at once.
//
// --- WHY --- the session key is NOT replaced on a later sign-in: a user
// has one key, and signing in on a second device must hand back the key
// the first device already has. so the key columns are only written when
// the row is created — the conflict branch updates the accounts and the
// timestamp and leaves the key alone.
//
// --- WHY --- the accounts are REPLACED and not merged: the browser sends
// every account it currently holds, so the list it sends IS the truth.
// merging would keep accounts the user has removed.
pub async fn session_upsert_fun(
    pool: &SqlitePool,
    user_id: &str,
    session_key_encrypted: &str,
    session_key_hash: &str,
    accounts: &[String],
) -> Result<SESSION_ROW, sqlx::Error> {
    let now = now_ms_fun();
    let accounts_json = serde_json::to_string(accounts).unwrap_or_else(|_| "[]".to_string());

    sqlx::query(
        "INSERT INTO sessions
       (user_id, session_key, session_key_hash, accounts, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?5)
     ON CONFLICT (user_id) DO UPDATE SET
       accounts    = excluded.accounts,
       updated_at = excluded.updated_at",
    )
    .bind(user_id)
    .bind(session_key_encrypted)
    .bind(session_key_hash)
    .bind(&accounts_json)
    .bind(now)
    .execute(pool)
    .await?;

    session_get_fun(pool, user_id)
        .await?
        .ok_or(sqlx::Error::RowNotFound)
}

// ========================================
// --- HELPERS ----------------------------
// turn a db row into a session.
fn row_to_session_fun(row: &sqlx::sqlite::SqliteRow) -> SESSION_ROW {
    let accounts_json: String = row.get("accounts");
    // --- WHY --- a broken json column reads as an empty list and not as an
    // error: the accounts list is a convenience for the ui, and a session
    // whose key is valid must keep working even if that column was
    // hand-edited.
    let accounts = serde_json::from_str::<Vec<String>>(&accounts_json).unwrap_or_default();
    SESSION_ROW {
        user_id: row.get("user_id"),
        session_key_encrypted: row.get("session_key"),
        session_key_hash: row.get("session_key_hash"),
        accounts,
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
