// ========================================
// the api key store, tested against a real sqlite file.
//
// the db is a temp file, not an in-memory one, because the production db
// is a file and the two can differ: WAL, the journal mode, and the way
// sqlite writes pages are all file behaviours.
use crate::backend::logic::endpoint_shit_1170_api_keys::api_key_fun::{
    api_key_generate_fun, api_key_hash_fun,
};
use crate::backend::logic::endpoint_shit_1170_api_keys::api_keys_store::{
    api_key_get_by_hash_fun, api_key_get_fun, api_key_list_account_ids_fun, api_key_rotate_fun,
    api_key_upsert_fun,
};
use sqlx::Row;
// ========================================
// --- HELPERS ----------------------------
// a temp db file, removed when the guard is dropped.
struct TEMP_DB {
    path: std::path::PathBuf,
}

impl TEMP_DB {
    fn new_fun(name: &str) -> Self {
        let mut path = std::env::temp_dir();
        path.push(format!("shit-1170-test-{name}-{:?}.db", std::process::id()));
        // a leftover from a previous run would make the test read old rows.
        let _ = std::fs::remove_file(&path);
        TEMP_DB { path }
    }

    async fn pool_fun(&self) -> sqlx::SqlitePool {
        crate::backend::logic::db::db_open_fun::db_open_fun(&self.path)
            .await
            .expect("the db should open")
    }
}

impl Drop for TEMP_DB {
    fn drop(&mut self) {
        // the sqlite sidecar files too, or the temp dir fills up.
        let _ = std::fs::remove_file(&self.path);
        let _ = std::fs::remove_file(format!("{}-wal", self.path.display()));
        let _ = std::fs::remove_file(format!("{}-shm", self.path.display()));
    }
}

// a stored api key for one account, with a fresh key.
async fn put_fun(pool: &sqlx::SqlitePool, account_id: &str) -> (String, String) {
    let key = api_key_generate_fun();
    let key_hash = api_key_hash_fun(&key);
    api_key_upsert_fun(pool, account_id, &key, &key_hash)
        .await
        .expect("the api key should save");
    (key, key_hash)
}
// ========================================
// --- TESTS -----------------------------
#[tokio::test]
async fn an_api_key_is_stored_and_read_back() {
    let db = TEMP_DB::new_fun("store");
    let pool = db.pool_fun().await;

    let (key, key_hash) = put_fun(&pool, "alice.near").await;

    let stored = api_key_get_fun(&pool, "alice.near")
        .await
        .expect("the api key should read")
        .expect("the api key should exist");
    assert_eq!(stored.account_id, "alice.near");
    assert_eq!(stored.api_key, key);
    assert_eq!(stored.api_key_hash, key_hash);
}

#[tokio::test]
async fn a_second_device_gets_the_same_key() {
    let db = TEMP_DB::new_fun("same-key");
    let pool = db.pool_fun().await;

    let (key, key_hash) = put_fun(&pool, "alice.near").await;

    // the second device signs in with the SAME account. the upsert must
    // not replace the key — the account has one key, and the first
    // device has to keep working.
    api_key_upsert_fun(&pool, "alice.near", &key, &key_hash)
        .await
        .expect("the api key should save again");

    let stored = api_key_get_fun(&pool, "alice.near")
        .await
        .expect("the api key should read")
        .expect("the api key should exist");
    assert_eq!(stored.api_key, key);

    // and there is exactly ONE row for the account.
    let count: (i64,) = sqlx::query_as("SELECT COUNT(1) FROM api_keys WHERE account_id = ?1")
        .bind("alice.near")
        .fetch_one(&pool)
        .await
        .expect("the count should read");
    assert_eq!(count.0, 1);
}

#[tokio::test]
async fn each_account_gets_its_own_key() {
    let db = TEMP_DB::new_fun("per-account");
    let pool = db.pool_fun().await;

    let (alice_key, _) = put_fun(&pool, "alice.near").await;
    let (bob_key, _) = put_fun(&pool, "bob.near").await;

    // --- WHY --- this is the whole point of the per-account model: two
    // accounts are two rows with two DIFFERENT keys. a key that served
    // both could not be narrowed to one wallet.
    assert_ne!(alice_key, bob_key);

    let alice = api_key_get_fun(&pool, "alice.near")
        .await
        .expect("the api key should read")
        .expect("the api key should exist");
    let bob = api_key_get_fun(&pool, "bob.near")
        .await
        .expect("the api key should read")
        .expect("the api key should exist");
    assert_eq!(alice.api_key, alice_key);
    assert_eq!(bob.api_key, bob_key);
}

#[tokio::test]
async fn an_api_key_is_found_by_its_hash() {
    let db = TEMP_DB::new_fun("by-hash");
    let pool = db.pool_fun().await;

    let (_key, key_hash) = put_fun(&pool, "alice.near").await;

    let found = api_key_get_by_hash_fun(&pool, &key_hash)
        .await
        .expect("the api key should read")
        .expect("the api key should exist");
    assert_eq!(found.account_id, "alice.near");

    // a key nobody has finds nothing.
    let missing = api_key_get_by_hash_fun(&pool, &api_key_hash_fun("nope"))
        .await
        .expect("the api key should read");
    assert!(missing.is_none());
}

#[tokio::test]
async fn the_accounts_are_listed() {
    let db = TEMP_DB::new_fun("list");
    let pool = db.pool_fun().await;

    put_fun(&pool, "alice.near").await;
    put_fun(&pool, "bob.near").await;

    let ids = api_key_list_account_ids_fun(&pool)
        .await
        .expect("the list should read");
    assert_eq!(ids, vec!["alice.near".to_string(), "bob.near".to_string()]);
}

#[tokio::test]
async fn a_rotation_replaces_the_key_and_the_old_one_stops_working() {
    let db = TEMP_DB::new_fun("rotate");
    let pool = db.pool_fun().await;

    let (old_key, old_hash) = put_fun(&pool, "alice.near").await;

    // the new key.
    let new_key = api_key_generate_fun();
    let new_hash = api_key_hash_fun(&new_key);
    api_key_rotate_fun(&pool, "alice.near", &new_key, &new_hash)
        .await
        .expect("the api key should rotate");

    // the new key is the one that is stored.
    let stored = api_key_get_fun(&pool, "alice.near")
        .await
        .expect("the api key should read")
        .expect("the api key should exist");
    assert_eq!(stored.api_key, new_key);

    // the OLD key no longer finds the api key — that is the point of a
    // rotation.
    let by_old = api_key_get_by_hash_fun(&pool, &old_hash)
        .await
        .expect("the api key should read");
    assert!(by_old.is_none(), "the old key must not find the api key");

    // and the new one does.
    let by_new = api_key_get_by_hash_fun(&pool, &new_hash)
        .await
        .expect("the api key should read")
        .expect("the api key should exist");
    assert_eq!(by_new.account_id, "alice.near");
    assert_ne!(old_key, new_key);
}

#[tokio::test]
async fn a_rotation_of_an_account_with_no_api_key_fails() {
    let db = TEMP_DB::new_fun("rotate-none");
    let pool = db.pool_fun().await;

    let key = api_key_generate_fun();
    let key_hash = api_key_hash_fun(&key);

    let result = api_key_rotate_fun(&pool, "nobody.near", &key, &key_hash).await;
    assert!(result.is_err(), "rotating a missing api key should fail");
}

#[tokio::test]
async fn the_schema_is_created_and_the_db_opens_again() {
    let db = TEMP_DB::new_fun("schema");
    // the db is opened twice: the second open finds the tables already
    // there and does nothing.
    let _pool = db.pool_fun().await;
    let pool = db.pool_fun().await;

    // the table is there, with the columns the code reads.
    let columns: Vec<String> = sqlx::query("SELECT name FROM pragma_table_info('api_keys')")
        .fetch_all(&pool)
        .await
        .expect("the columns should read")
        .iter()
        .map(|row| row.get::<String, _>("name"))
        .collect();
    assert_eq!(
        columns,
        vec![
            "account_id",
            "api_key",
            "api_key_hash",
            "created_at",
            "updated_at"
        ]
    );

    // and there is no bookkeeping table — there is no migration system.
    let tables: Vec<String> = sqlx::query("SELECT name FROM sqlite_master WHERE type = 'table'")
        .fetch_all(&pool)
        .await
        .expect("the tables should read")
        .iter()
        .map(|row| row.get::<String, _>("name"))
        .collect();
    assert!(
        !tables.contains(&"_sqlx_migrations".to_string()),
        "there is no migration system, so there is no bookkeeping table"
    );
}

#[test]
fn a_key_is_random_and_long() {
    let first = api_key_generate_fun();
    let second = api_key_generate_fun();
    // the prefix (10 chars), then 32 bytes hex encoded.
    assert_eq!(first.len(), 74);
    assert_ne!(first, second);
}

#[test]
fn a_new_key_carries_the_prefix() {
    let key = api_key_generate_fun();
    assert!(
        key.starts_with("shit_1170_"),
        "a new key must start with the prefix"
    );
    // the part after the prefix is the 64 hex characters of the random
    // bytes, and nothing else.
    let random_part = &key["shit_1170_".len()..];
    assert_eq!(random_part.len(), 64);
    assert!(
        random_part.chars().all(|c| c.is_ascii_hexdigit()),
        "the random part must be hex"
    );
}

#[tokio::test]
async fn a_key_without_the_prefix_still_hashes_and_is_found() {
    // an OLD key — one made before the prefix existed — has to keep
    // working. the read path hashes the whole key, so its hash is found
    // by the very same lookup.
    let old_style_key = "ab7fca21168a6961f47677dee81dc178cd0aa9b7146c38fa9c87c3bd1e0f8fc2";
    let old_style_hash = api_key_hash_fun(old_style_key);

    let db = TEMP_DB::new_fun("old-key");
    let pool = db.pool_fun().await;

    api_key_upsert_fun(&pool, "alice.near", old_style_key, &old_style_hash)
        .await
        .expect("the api key should save");

    let found = api_key_get_by_hash_fun(&pool, &old_style_hash)
        .await
        .expect("the api key should read")
        .expect("the api key should exist");
    assert_eq!(found.account_id, "alice.near");
    assert_eq!(found.api_key, old_style_key);
}

#[test]
fn a_key_hashes_to_a_fixed_length_hash() {
    let key = api_key_generate_fun();
    let hash = api_key_hash_fun(&key);
    // sha-256, hex encoded.
    assert_eq!(hash.len(), 64);
    // the same key always hashes the same, and the hash is not the key.
    assert_eq!(hash, api_key_hash_fun(&key));
    assert_ne!(hash, key);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
