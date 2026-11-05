// ========================================
// the feed WEBSOCKET route, tested against a real server.
//
// the router is served on a real listener and reached over a real
// websocket, so the test goes through the real upgrade handshake, the
// real broadcast bus and the real frame writing.
//
// --- WHY --- the db is a temp FILE and not an in-memory one: the
// production db is a file, and the two can differ — WAL, the journal
// mode, and the way sqlite writes pages are all file behaviours.
//
// --- WHY --- the api keys are put into the db DIRECTLY: the point of
// this test is the socket, and minting a key through the api-keys route
// would only add a way for the test to fail for a reason that has
// nothing to do with the socket.
use serde_json::{Value, json};
use sqlx::SqlitePool;
use tokio_tungstenite::tungstenite::Message;
// ========================================
// --- HELPERS ----------------------------
// a temp db file, removed when the guard is dropped.
struct TEMP_DB {
    path: std::path::PathBuf,
}

impl TEMP_DB {
    fn new_fun(name: &str) -> Self {
        let mut path = std::env::temp_dir();
        path.push(format!(
            "shit-1170-feed-ws-{name}-{:?}.db",
            std::process::id()
        ));
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

// an api key for one account, put straight into the db.
async fn put_api_key_fun(pool: &SqlitePool, account_id: &str) -> String {
    use crate::backend::logic::endpoint_shit_1170_api_keys::api_key_fun::api_key_hash_fun;
    use crate::backend::logic::endpoint_shit_1170_api_keys::api_keys_store::api_key_upsert_fun;

    let api_key = format!("shit_1170_{account_id}");
    let api_key_hash = api_key_hash_fun(&api_key);
    api_key_upsert_fun(pool, account_id, &api_key, &api_key_hash)
        .await
        .expect("the api key should save");
    api_key
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

// a websocket client, connected to the feed socket.
//
// --- WHY --- the url is rewritten: the socket speaks http until the
// upgrade, and the upgrade asks for a websocket.
async fn connect_fun(
    base_url: &str,
) -> tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>> {
    let ws_url = base_url.replacen("http://", "ws://", 1);
    let (socket, _answer) =
        tokio_tungstenite::connect_async(format!("{ws_url}/api/shit-1170/feed/ws"))
            .await
            .expect("the socket should connect");
    socket
}

// the next TEXT message the server sends.
//
// --- WHY --- the CONTROL frames are skipped: the server pings the
// client, and a ping is not a message the client reads.
async fn next_text_fun(
    socket: &mut tokio_tungstenite::WebSocketStream<
        tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>,
    >,
) -> Value {
    use futures_util::StreamExt;

    let deadline = tokio::time::Instant::now() + std::time::Duration::from_secs(5);
    loop {
        let next = tokio::time::timeout_at(deadline, socket.next())
            .await
            .expect("the server should send a message");
        let message = next
            .expect("the socket should stay open")
            .expect("the frame should be whole");
        if let Message::Text(text) = message {
            let value: Value = serde_json::from_str(&text).expect("the message should be json");
            return value;
        }
    }
}

// a body with one transaction in it.
fn one_tx_body_fun() -> Value {
    json!({
        "what": "swap 100 USDC for NEAR",
        "when": "when the price is right",
        "why": "you said to move half your usdc",
        "whenAt": 1_772_666_400_000i64,
        "transactions": [
            {
                "contractId": "ref.finance.near",
                "method": "ft_swap",
                "args": { "receiver_id": "alice.near", "amount": "100000000" },
                "gas": "30000000000000",
                "deposit": "1"
            }
        ]
    })
}

// a swap body.
fn one_swap_body_fun() -> Value {
    json!({
        "what": "sell usdc",
        "tokenIn": "usdt.tether-token.near",
        "amountIn": "100000000",
        "tokenOut": "wrap.near"
    })
}

// a POST to the tx queue.
async fn post_queue_fun(base_url: &str, api_key: &str, body: &Value) -> Value {
    let text = reqwest::Client::new()
        .post(format!("{base_url}/api/shit-1170/tx-queue"))
        .header("x-api-key", api_key)
        .json(body)
        .send()
        .await
        .expect("the route should answer")
        .text()
        .await
        .expect("the body should read");
    serde_json::from_str(&text).expect("the body should be json")
}

// a POST to the swap queue.
async fn post_swap_fun(base_url: &str, api_key: &str, body: &Value) -> Value {
    let text = reqwest::Client::new()
        .post(format!("{base_url}/api/shit-1170/swap-queue"))
        .header("x-api-key", api_key)
        .json(body)
        .send()
        .await
        .expect("the route should answer")
        .text()
        .await
        .expect("the body should read");
    serde_json::from_str(&text).expect("the body should be json")
}
// ========================================
// --- TESTS -----------------------------
#[tokio::test]
async fn a_queued_batch_is_pushed_to_the_socket() {
    let db = TEMP_DB::new_fun("queue");
    let pool = db.pool_fun().await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let mut socket = connect_fun(&base_url).await;

    // the batch is queued AFTER the socket is open, so the socket has to
    // be listening for it.
    let queued = post_queue_fun(&base_url, &alice_key, &one_tx_body_fun()).await;

    let event = next_text_fun(&mut socket).await;

    assert_eq!(event["type"], "queue");
    // --- WHY --- THE LIVE POST IS THE SAME POST: the client's live item
    // has to be byte-for-byte what a refetch would give it.
    assert_eq!(
        event["queue"], queued,
        "the pushed queue is the answered queue"
    );
}

#[tokio::test]
async fn a_queued_swap_is_pushed_to_the_socket() {
    let db = TEMP_DB::new_fun("swap");
    let pool = db.pool_fun().await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let mut socket = connect_fun(&base_url).await;

    let queued = post_swap_fun(&base_url, &alice_key, &one_swap_body_fun()).await;

    let event = next_text_fun(&mut socket).await;

    assert_eq!(event["type"], "swap");
    assert_eq!(
        event["swap"], queued,
        "the pushed swap is the answered swap"
    );
}

#[tokio::test]
async fn the_pushed_message_carries_the_whole_queue_item() {
    let db = TEMP_DB::new_fun("whole-item");
    let pool = db.pool_fun().await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let mut socket = connect_fun(&base_url).await;

    let mut body = one_tx_body_fun();
    body["accounts"] = json!(["alice.near"]);
    post_queue_fun(&base_url, &alice_key, &body).await;

    let event = next_text_fun(&mut socket).await;

    // the message carries the type and the payload, and nothing else.
    let keys: Vec<&String> = event.as_object().expect("an object").keys().collect();
    assert_eq!(
        keys.len(),
        2,
        "the message carries the type and the payload"
    );

    // and the payload is the WHOLE queue item.
    let queue = &event["queue"];
    assert!(queue["queueId"].as_str().is_some());
    assert_eq!(queue["what"], "swap 100 USDC for NEAR");
    assert_eq!(queue["when"], "when the price is right");
    assert_eq!(queue["why"], "you said to move half your usdc");
    assert_eq!(queue["whenAt"], 1_772_666_400_000i64);
    assert!(queue["createdAt"].as_i64().is_some());
    assert!(queue["updatedAt"].as_i64().is_some());

    let transactions = queue["transactions"].as_array().expect("transactions");
    assert_eq!(transactions.len(), 1);
    assert_eq!(transactions[0]["method"], "ft_swap");
    assert_eq!(transactions[0]["contractId"], "ref.finance.near");
    assert_eq!(transactions[0]["args"]["receiver_id"], "alice.near");

    let accounts = queue["accounts"].as_array().expect("accounts");
    assert_eq!(accounts.len(), 1);
    assert_eq!(accounts[0]["accountId"], "alice.near");
    assert_eq!(accounts[0]["status"], "pending");
}

#[tokio::test]
async fn a_socket_that_nobody_queues_to_just_sits_there() {
    let db = TEMP_DB::new_fun("quiet");
    let pool = db.pool_fun().await;
    let _ = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let mut socket = connect_fun(&base_url).await;

    // --- WHY --- NOTHING IS EXPECTED: a client that connects and
    // receives nothing is a client with no new work. the socket must
    // not answer with a greeting, an ack or an error.
    //
    // the ping is a CONTROL frame, so the client's message handler does
    // not see it — only text and binary frames are read here.
    use futures_util::StreamExt;
    let deadline = tokio::time::Instant::now() + std::time::Duration::from_millis(500);
    loop {
        let next = tokio::time::timeout_at(deadline, socket.next()).await;
        let Ok(Some(Ok(message))) = next else {
            // nothing came, or the deadline passed. either way, the
            // socket did not send a message.
            break;
        };
        assert!(
            !matches!(message, Message::Text(_) | Message::Binary(_)),
            "the server must send nothing but events"
        );
    }
}

#[tokio::test]
async fn a_client_that_goes_away_does_not_take_the_server_with_it() {
    let db = TEMP_DB::new_fun("gone");
    let pool = db.pool_fun().await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    // a socket that connects and drops.
    {
        let mut socket = connect_fun(&base_url).await;
        let _ = socket.close(None).await;
    }

    // and the server is still there for the next one.
    let mut socket = connect_fun(&base_url).await;
    post_queue_fun(&base_url, &alice_key, &one_tx_body_fun()).await;
    let event = next_text_fun(&mut socket).await;
    assert_eq!(event["type"], "queue");
}

#[tokio::test]
async fn the_socket_path_is_not_swallowed_by_the_static_folder() {
    let db = TEMP_DB::new_fun("not-swallowed");
    let pool = db.pool_fun().await;
    let base_url = serve_fun(pool).await;

    // --- WHY --- the static folder is the FALLBACK at `/`, so an
    // unmatched GET comes from there. the socket has to be on the api
    // router, or the browser would ask the static folder for a
    // websocket and get nothing.
    //
    // a plain GET (not an upgrade) on the socket path must NOT answer
    // with a 404 from the static folder — it must answer with the
    // websocket route's own refusal of a request that is not an upgrade.
    let answer = reqwest::Client::new()
        .get(format!("{base_url}/api/shit-1170/feed/ws"))
        .send()
        .await
        .expect("the route should answer");
    let status = answer.status().as_u16();
    assert_ne!(
        status, 404,
        "the socket path must not fall through to the static folder"
    );
}
