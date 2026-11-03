// ========================================
// the session key prefix, tested through the REAL routes.
//
// the store test proves the key is made with the prefix. this proves
// the thing that matters: a key made with the prefix WORKS, and a key
// made before the prefix existed STILL WORKS.
//
// the read path hashes the WHOLE key — prefix and all — and the db is
// looked up by that hash, so a key of either shape finds its account.
//
// --- WHY --- the router is served on a real listener and reached over
// http, and not called with `oneshot`: `oneshot` needs the `tower`
// crate in scope, and `tower` is not a dependency of this project —
// it only comes in through axum. serving it for real needs nothing
// new, and it is closer to how the app actually runs.
//
// --- WHY --- a temp db file and not an in-memory one: the production
// db is a file, and the two can differ. the same reason the store test
// uses a file.
use sqlx::SqlitePool;
// ========================================
// --- HELPERS ----------------------------
// a temp db file, removed when the guard is dropped.
struct TEMP_DB {
    path: std::path::PathBuf,
}

impl TEMP_DB {
    fn new_fun(name: &str) -> Self {
        let mut path = std::env::temp_dir();
        path.push(format!("shit-1170-prefix-{name}-{:?}.db", std::process::id()));
        // a leftover from a previous run would make the test read old rows.
        let _ = std::fs::remove_file(&path);
        TEMP_DB { path }
    }

    async fn pool_fun(&self) -> SqlitePool {
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

// put a session into the db with the given key, the way the sessions
// route would have.
async fn put_session_fun(pool: &SqlitePool, account_id: &str, session_key: &str) {
    use crate::backend::logic::endpoint_shit_1170_sessions::session_key_fun::session_key_hash_fun;
    use crate::backend::logic::endpoint_shit_1170_sessions::sessions_store::session_upsert_fun;

    let session_key_hash = session_key_hash_fun(session_key);
    session_upsert_fun(pool, account_id, session_key, &session_key_hash)
        .await
        .expect("the session should save");
}

// a running server on a free port, and the url it answers on.
//
// --- WHY --- port 0: the OS picks a free port, so the tests do not
// fight over one fixed port and cannot collide with the live app.
async fn serve_fun(pool: SqlitePool) -> String {
    use crate::backend::routes::app_router_fun::app_router_fun;

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("the listener should bind");
    let addr = listener.local_addr().expect("the addr should read");
    let app = app_router_fun(pool);

    tokio::spawn(async move {
        let _ = axum::serve(listener, app).await;
    });

    format!("http://{addr}")
}

// ask the me-route who a key belongs to, and give back the status and
// the body.
async fn who_am_i_fun(base_url: &str, session_key: &str) -> (u16, String) {
    let response = reqwest::Client::new()
        .get(format!("{base_url}/api/shit-1170/session/me"))
        .header("x-session-token", session_key)
        .send()
        .await
        .expect("the route should answer");
    let status = response.status().as_u16();
    let body = response.text().await.unwrap_or_default();
    (status, body)
}
// ========================================
// --- TESTS -----------------------------
#[tokio::test]
async fn a_new_key_carries_the_prefix_and_works() {
    let db = TEMP_DB::new_fun("new");
    let pool = db.pool_fun().await;

    use crate::backend::logic::endpoint_shit_1170_sessions::session_key_fun::session_key_generate_fun;
    let key = session_key_generate_fun();

    assert!(
        key.starts_with("shit_1170_"),
        "a new key must start with the prefix, got {key}"
    );

    put_session_fun(&pool, "alice.near", &key).await;
    let base_url = serve_fun(pool).await;

    let (status, body) = who_am_i_fun(&base_url, &key).await;
    assert_eq!(status, 200, "body was: {body}");
    assert!(
        body.contains("alice.near"),
        "the key must find its account, body was: {body}"
    );
}

#[tokio::test]
async fn an_old_key_without_the_prefix_still_works() {
    let db = TEMP_DB::new_fun("old");
    let pool = db.pool_fun().await;

    // a key made before the prefix existed.
    let old_key = "ab7fca21168a6961f47677dee81dc178cd0aa9b7146c38fa9c87c3bd1e0f8fc2";

    put_session_fun(&pool, "alice.near", old_key).await;
    let base_url = serve_fun(pool).await;

    let (status, body) = who_am_i_fun(&base_url, old_key).await;
    assert_eq!(status, 200, "body was: {body}");
    assert!(
        body.contains("alice.near"),
        "an old key must still find its account, body was: {body}"
    );
}

#[tokio::test]
async fn a_key_that_is_not_ours_is_refused() {
    let db = TEMP_DB::new_fun("nope");
    let pool = db.pool_fun().await;
    let base_url = serve_fun(pool).await;

    let (status, body) = who_am_i_fun(
        &base_url,
        "shit_1170_00000000000000000000000000000000000000000000000000000000000000",
    )
    .await;
    assert_eq!(status, 401, "body was: {body}");
    assert!(
        body.contains("unknown_session_key"),
        "the answer must name the reason, body was: {body}"
    );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
