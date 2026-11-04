// ========================================
// API_KEYS_STORE
// the db access for the api_keys table. every read and every write of an
// api key goes through this file, so the sql lives in one place.
//
// --- WHY --- one row per ACCOUNT and not per person: an account has
// exactly one api key, and the account id is the row's identity.
// signing in with the same account on another device finds the same row
// and hands back the same key.
//
// --- WHY --- there is no linking and no accounts list: an account
// belongs to itself. there is no question of which person an account
// belongs to, so there is nothing to merge and nothing to keep in
// agreement.
//
// --- WHY --- the api key is stored AS IT IS: the key can be handed
// back out on a later sign-in, so the db has to be able to produce it
// again, and the key is ours and the db is ours.
//
// --- WHY --- the table is named `api_keys` and not `sessions`: the
// credential in it is not a browser session. the user signs in once and
// hands the key to an agent, and the agent holds it as a bearer token
// for as long as it lives.
use sqlx::{Row, SqlitePool};
// ========================================
// --- TYPES ------------------------------
// one api key, as it comes out of the db.
#[derive(Debug, Clone)]
pub struct API_KEY_ROW {
    // the account the api key belongs to. it is the row's primary key.
    pub account_id: String,
    // the api key.
    pub api_key: String,
    // the hash of the api key. a request is looked up by this.
    pub api_key_hash: String,
    // when the api key was created, in ms since the epoch.
    pub created_at: i64,
    // when the api key was last touched, in ms since the epoch.
    pub updated_at: i64,
}
// ========================================
// --- READ ------------------------------
// one api key by its account id, or None.
pub async fn api_key_get_fun(
    pool: &SqlitePool,
    account_id: &str,
) -> Result<Option<API_KEY_ROW>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT account_id, api_key, api_key_hash, created_at, updated_at
       FROM api_keys
      WHERE account_id = ?1",
    )
    .bind(account_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| row_to_api_key_fun(&row)))
}

// one api key by its hash, or None.
//
// --- WHY --- the lookup is by the HASH: a request arrives carrying the
// real key, it is hashed, and the hash is what is looked up. the real key
// is never compared against anything in the db, and no row is decrypted
// to find the match.
pub async fn api_key_get_by_hash_fun(
    pool: &SqlitePool,
    api_key_hash: &str,
) -> Result<Option<API_KEY_ROW>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT account_id, api_key, api_key_hash, created_at, updated_at
       FROM api_keys
      WHERE api_key_hash = ?1",
    )
    .bind(api_key_hash)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| row_to_api_key_fun(&row)))
}

// every account that has an api key, in insertion order.
pub async fn api_key_list_account_ids_fun(pool: &SqlitePool) -> Result<Vec<String>, sqlx::Error> {
    let rows = sqlx::query("SELECT account_id FROM api_keys ORDER BY created_at ASC")
        .fetch_all(pool)
        .await?;
    Ok(rows.iter().map(|row| row.get("account_id")).collect())
}
// ========================================
// --- WRITE -----------------------------
// create the api key for an account, or return the one that already
// exists.
//
// --- WHY --- this is one statement and not a select-then-insert: two
// sign-ins for the same account at the same moment would both see "no
// row" and both insert, and the second insert would fail on the primary
// key. the upsert keeps exactly one row per account no matter how many
// devices sign in at once.
//
// --- WHY --- the api key is NOT replaced on a later sign-in: an
// account has one key, and signing in on a second device must hand back
// the key the first device already has. so the key columns are only
// written when the row is created — the conflict branch only refreshes
// the timestamp.
pub async fn api_key_upsert_fun(
    pool: &SqlitePool,
    account_id: &str,
    api_key: &str,
    api_key_hash: &str,
) -> Result<API_KEY_ROW, sqlx::Error> {
    let now = now_ms_fun();

    sqlx::query(
        "INSERT INTO api_keys
       (account_id, api_key, api_key_hash, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?4)
     ON CONFLICT (account_id) DO UPDATE SET
       updated_at = excluded.updated_at",
    )
    .bind(account_id)
    .bind(api_key)
    .bind(api_key_hash)
    .bind(now)
    .execute(pool)
    .await?;

    api_key_get_fun(pool, account_id)
        .await?
        .ok_or(sqlx::Error::RowNotFound)
}

// ========================================
// --- ROTATE ----------------------------
// replace an account's api key with a new one.
//
// --- WHY --- this is a separate statement and not an upsert: a rotate
// has to REPLACE the key, and the upsert deliberately never replaces it.
// a rotate that did not change the key would be a no-op that still told
// the reader their key had been rotated.
//
// --- WHY --- the new key's hash goes in with it: a request is looked up
// by the hash, so a rotated key that kept the old hash would still be
// found by the old key — which is exactly what a rotation must stop.
pub async fn api_key_rotate_fun(
    pool: &SqlitePool,
    account_id: &str,
    api_key: &str,
    api_key_hash: &str,
) -> Result<API_KEY_ROW, sqlx::Error> {
    let now = now_ms_fun();

    let result = sqlx::query(
        "UPDATE api_keys
        SET api_key = ?2, api_key_hash = ?3, updated_at = ?4
      WHERE account_id = ?1",
    )
    .bind(account_id)
    .bind(api_key)
    .bind(api_key_hash)
    .bind(now)
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(sqlx::Error::RowNotFound);
    }

    api_key_get_fun(pool, account_id)
        .await?
        .ok_or(sqlx::Error::RowNotFound)
}
// ========================================
// --- HELPERS ----------------------------
// turn a db row into an api key.
fn row_to_api_key_fun(row: &sqlx::sqlite::SqliteRow) -> API_KEY_ROW {
    API_KEY_ROW {
        account_id: row.get("account_id"),
        api_key: row.get("api_key"),
        api_key_hash: row.get("api_key_hash"),
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
