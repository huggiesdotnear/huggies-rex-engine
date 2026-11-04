// ========================================
// API_KEY_ACCOUNT_FUN
// the account an api key belongs to, or None.
//
// --- WHY --- this is its own file: several routes need the same answer
// — "which account is the caller?" — and the answer must be written down
// once. if each route asked the db itself, one of them would eventually
// ask it slightly differently.
//
// --- WHY --- the key is HASHED here and looked up by the hash: the db
// holds the hash, so the plain key is never compared against anything in
// the db, and no row is decrypted to find the match.
use sqlx::SqlitePool;

use crate::backend::logic::endpoint_shit_1170_api_keys::api_key_fun::api_key_hash_fun;
use crate::backend::logic::endpoint_shit_1170_api_keys::api_keys_store::api_key_get_by_hash_fun;
// ========================================
// --- ACCOUNT ---------------------------
// the account the api key belongs to, or None if the key is not one of
// ours.
//
// --- WHY --- None and not an error: a key nobody has is not a broken
// db, it is a bad credential. the caller turns it into a 401.
pub async fn api_key_account_fun(
    pool: &SqlitePool,
    api_key: &str,
) -> Result<Option<String>, sqlx::Error> {
    let api_key_hash = api_key_hash_fun(api_key);

    let found = api_key_get_by_hash_fun(pool, &api_key_hash).await?;

    Ok(found.map(|row| row.account_id))
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
