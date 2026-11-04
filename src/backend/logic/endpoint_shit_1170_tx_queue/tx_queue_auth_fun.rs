// ========================================
// TX_QUEUE_AUTH_FUN
// the shared "whose queue is this" check.
//
// --- WHY --- this is its own file: three routes need the same question
// answered — "is the caller allowed to touch this queue?" — and the
// answer must be written down once. if each route asked the db itself,
// one of them would eventually ask it slightly differently.
//
// --- WHY --- the answer is "the caller's account is ON the queue": the
// queue is an open offer, and the accounts on it are the ones who were
// named for it and the ones who joined it. a caller who is on the queue
// is one of the people it is for.
//
// --- WHY --- this does NOT check the api key itself: the key is already
// checked by the api keys folder, which knows how a key is hashed and
// how it is looked up. this folder asks what that key means.
use sqlx::SqlitePool;

use crate::backend::logic::endpoint_shit_1170_api_keys::api_key_account_fun::api_key_account_fun;
// ========================================
// --- ACCOUNT OF CALLER -----------------
// the account the caller's api key belongs to, or None if the key is not
// one of ours.
//
// --- WHY --- None and not an error: a key nobody has is not a broken db,
// it is a bad credential. the caller turns it into a 401.
//
// --- WHY --- the key is HASHED and looked up by the hash: the db holds
// the hash, so the plain key is never compared against anything in the
// db, and no row is decrypted to find the match.
pub async fn tx_queue_account_of_caller_fun(
    pool: &SqlitePool,
    api_key: &str,
) -> Result<Option<String>, sqlx::Error> {
    api_key_account_fun(pool, api_key).await
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
