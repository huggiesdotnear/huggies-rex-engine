// ========================================
// the session store, tested against a real sqlite file.
//
// the db is a temp file, not an in-memory one, because the production db
// is a file and the two can differ: WAL, the journal mode, and the way
// sqlite writes pages are all file behaviours.
//
// the session key's secret is set by the test, because the store cannot
// encrypt anything without it.
use crate::backend::logic::session_key_fun::{
    session_key_decrypt_fun, session_key_encrypt_fun, session_key_generate_fun,
    session_key_hash_fun,
};
use crate::backend::logic::sessions_store::{
    session_get_by_key_hash_fun, session_get_fun, session_upsert_fun,
};
// ========================================
// --- CONFIG -----------------------------
// the secret the test encrypts with. it is passed in and never read from
// the environment, so the test does not depend on the process state.
const TEST_SECRET: &str = "test-secret-for-the-store";
// ========================================
// --- HELPERS ----------------------------
// a temp db file, removed when the guard is dropped.
struct TEMP_DB {
    path: std::path::PathBuf,
}

impl TEMP_DB {
    fn new_fun(name: &str) -> Self {
        let mut path = std::env::temp_dir();
        path.push(format!("huggies-test-{name}-{:?}.db", std::process::id()));
        // a leftover from a previous run would make the test read old rows.
        let _ = std::fs::remove_file(&path);
        TEMP_DB { path }
    }

    async fn pool_fun(&self) -> sqlx::SqlitePool {
        crate::backend::logic::db::db_open_fun(&self.path)
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
// ========================================
// --- TESTS -----------------------------
#[tokio::test]
async fn a_session_is_stored_and_read_back() {
    let db = TEMP_DB::new_fun("store");
    let pool = db.pool_fun().await;

    let key = session_key_generate_fun();
    let key_hash = session_key_hash_fun(&key);
    let key_encrypted = session_key_encrypt_fun(TEST_SECRET, &key).expect("the key should encrypt");

    let accounts = vec!["alice.near".to_string(), "bob.near".to_string()];
    session_upsert_fun(&pool, "alice.near", &key_encrypted, &key_hash, &accounts)
        .await
        .expect("the session should save");

    let stored = session_get_fun(&pool, "alice.near")
        .await
        .expect("the session should read")
        .expect("the session should exist");
    assert_eq!(stored.user_id, "alice.near");
    assert_eq!(stored.accounts, accounts);
    assert_eq!(stored.session_key_hash, key_hash);

    // the key comes back out of the db and is the SAME key.
    let decrypted = session_key_decrypt_fun(TEST_SECRET, &stored.session_key_encrypted)
        .expect("the key should decrypt");
    assert_eq!(decrypted, key);
}

#[tokio::test]
async fn a_second_device_gets_the_same_key() {
    let db = TEMP_DB::new_fun("same-key");
    let pool = db.pool_fun().await;

    let key = session_key_generate_fun();
    let key_hash = session_key_hash_fun(&key);
    let key_encrypted = session_key_encrypt_fun(TEST_SECRET, &key).expect("the key should encrypt");
    let accounts = vec!["alice.near".to_string()];

    // the first device signs in.
    session_upsert_fun(&pool, "alice.near", &key_encrypted, &key_hash, &accounts)
        .await
        .expect("the session should save");

    // the second device signs in with the SAME key. the upsert must not
    // replace it — the user has one key, and the first device has to keep
    // working.
    session_upsert_fun(&pool, "alice.near", &key_encrypted, &key_hash, &accounts)
        .await
        .expect("the session should save again");

    let stored = session_get_fun(&pool, "alice.near")
        .await
        .expect("the session should read")
        .expect("the session should exist");
    let decrypted = session_key_decrypt_fun(TEST_SECRET, &stored.session_key_encrypted)
        .expect("the key should decrypt");
    assert_eq!(decrypted, key);

    // and there is exactly ONE row for the user.
    let count: (i64,) = sqlx::query_as("SELECT COUNT(1) FROM sessions WHERE user_id = ?1")
        .bind("alice.near")
        .fetch_one(&pool)
        .await
        .expect("the count should read");
    assert_eq!(count.0, 1);
}

#[tokio::test]
async fn a_session_is_found_by_its_key_hash() {
    let db = TEMP_DB::new_fun("by-hash");
    let pool = db.pool_fun().await;

    let key = session_key_generate_fun();
    let key_hash = session_key_hash_fun(&key);
    let key_encrypted = session_key_encrypt_fun(TEST_SECRET, &key).expect("the key should encrypt");

    session_upsert_fun(
        &pool,
        "alice.near",
        &key_encrypted,
        &key_hash,
        &["alice.near".to_string()],
    )
    .await
    .expect("the session should save");

    let found = session_get_by_key_hash_fun(&pool, &key_hash)
        .await
        .expect("the session should read")
        .expect("the session should exist");
    assert_eq!(found.user_id, "alice.near");

    // a key nobody has finds nothing.
    let missing = session_get_by_key_hash_fun(&pool, &session_key_hash_fun("nope"))
        .await
        .expect("the session should read");
    assert!(missing.is_none());
}

#[tokio::test]
async fn the_migrations_are_not_run_twice() {
    let db = TEMP_DB::new_fun("migrate");
    // the db is opened twice, so the migrations run twice. the second run
    // must find them already applied and do nothing.
    let _pool = db.pool_fun().await;
    let pool = db.pool_fun().await;

    let count: (i64,) = sqlx::query_as("SELECT COUNT(1) FROM _sqlx_migrations WHERE success = 1")
        .fetch_one(&pool)
        .await
        .expect("the count should read");
    assert_eq!(count.0, 1, "the one migration should be recorded once");
}

#[test]
fn a_key_encrypts_and_decrypts_back_to_itself() {
    let key = session_key_generate_fun();
    let encrypted = session_key_encrypt_fun(TEST_SECRET, &key).expect("the key should encrypt");
    // the encrypted form must not contain the plain key.
    assert!(!encrypted.contains(&key));
    let decrypted =
        session_key_decrypt_fun(TEST_SECRET, &encrypted).expect("the key should decrypt");
    assert_eq!(decrypted, key);
}

#[test]
fn two_encryptions_of_one_key_differ() {
    let key = session_key_generate_fun();
    let first = session_key_encrypt_fun(TEST_SECRET, &key).expect("the key should encrypt");
    let second = session_key_encrypt_fun(TEST_SECRET, &key).expect("the key should encrypt");
    // the nonce is random per call, so the ciphertext is never the same
    // twice.
    assert_ne!(first, second);
    assert_eq!(
        session_key_decrypt_fun(TEST_SECRET, &first).expect("the key should decrypt"),
        key
    );
    assert_eq!(
        session_key_decrypt_fun(TEST_SECRET, &second).expect("the key should decrypt"),
        key
    );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
