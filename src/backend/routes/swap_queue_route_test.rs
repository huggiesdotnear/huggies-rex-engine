// ========================================
// the swap queue ROUTES, tested against a real sqlite file and a real
// server.
//
// the router is served on a real listener and reached over http, so the
// tests go through the real routing, the real path params, the real
// query params and the real body extraction.
//
// --- WHY --- the db is a temp FILE and not an in-memory one: the
// production db is a file, and the two can differ — WAL, the journal
// mode, and the way sqlite writes pages are all file behaviours.
//
// --- WHY --- the api keys are put into the db DIRECTLY: the point of
// these tests is the swap queue routes, and minting a key through the
// api-keys route would only add a way for the test to fail for a reason
// that has nothing to do with the queue.
use serde_json::{Value, json};
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
        path.push(format!(
            "shit-1170-swap-route-{name}-{:?}.db",
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

// one answered request: the status and the parsed body.
struct THE_REPLY {
    status: u16,
    body: Value,
}

// a POST to the swap queue with the given api key (or none) and the
// given body.
async fn post_swap_fun(base_url: &str, api_key: Option<&str>, body: &Value) -> THE_REPLY {
    let mut request = reqwest::Client::new()
        .post(format!("{base_url}/api/shit-1170/swap-queue"))
        .json(body);
    if let Some(api_key) = api_key {
        request = request.header("x-api-key", api_key);
    }
    answer_fun(request.send().await.expect("the route should answer")).await
}

// a POST to the sent route of one swap.
async fn post_sent_fun(
    base_url: &str,
    api_key: &str,
    swap_id: &str,
    body: &Value,
) -> THE_REPLY {
    let request = reqwest::Client::new()
        .post(format!("{base_url}/api/shit-1170/swap-queue/{swap_id}/sent"))
        .header("x-api-key", api_key)
        .json(body);
    answer_fun(request.send().await.expect("the route should answer")).await
}

// a POST to the accounts route of one swap.
async fn post_account_fun(
    base_url: &str,
    api_key: &str,
    swap_id: &str,
    account_id: &str,
) -> THE_REPLY {
    let request = reqwest::Client::new()
        .post(format!("{base_url}/api/shit-1170/swap-queue/{swap_id}/accounts"))
        .header("x-api-key", api_key)
        .json(&json!({ "accountId": account_id }));
    answer_fun(request.send().await.expect("the route should answer")).await
}

// a DELETE of one account from one swap.
async fn delete_account_fun(
    base_url: &str,
    api_key: &str,
    swap_id: &str,
    account_id: &str,
) -> THE_REPLY {
    let request = reqwest::Client::new()
        .delete(format!(
            "{base_url}/api/shit-1170/swap-queue/{swap_id}/accounts/{account_id}"
        ))
        .header("x-api-key", api_key);
    answer_fun(request.send().await.expect("the route should answer")).await
}

// a GET of the swap list, with the given query string.
async fn get_list_fun(base_url: &str, api_key: Option<&str>, query: &str) -> THE_REPLY {
    let mut request = reqwest::Client::new().get(format!(
        "{base_url}/api/shit-1170/swap-queue?{query}"
    ));
    if let Some(api_key) = api_key {
        request = request.header("x-api-key", api_key);
    }
    answer_fun(request.send().await.expect("the route should answer")).await
}

// a GET of one swap.
async fn get_one_fun(base_url: &str, api_key: Option<&str>, swap_id: &str) -> THE_REPLY {
    let mut request = reqwest::Client::new().get(format!(
        "{base_url}/api/shit-1170/swap-queue/{swap_id}"
    ));
    if let Some(api_key) = api_key {
        request = request.header("x-api-key", api_key);
    }
    answer_fun(request.send().await.expect("the route should answer")).await
}

// the status and the parsed body of an answered request.
//
// --- WHY --- the body is PARSED and not kept as text: the tests assert
// on the shape of the answer, and a json value says the shape.
async fn answer_fun(response: reqwest::Response) -> THE_REPLY {
    let status = response.status().as_u16();
    let text = response.text().await.unwrap_or_default();
    let body = serde_json::from_str(&text).unwrap_or(Value::Null);
    THE_REPLY { status, body }
}

// a body with one swap in it.
fn one_swap_body_fun() -> Value {
    json!({
        "what": "swap 100 USDC for NEAR",
        "when": "when the price is right",
        "why": "you said to move half your usdc",
        "whenAt": 1_772_666_400_000i64,
        "tokenIn": "usdt.tether-token.near",
        "amountIn": "100000000",
        "tokenOut": "near",
        "amountOut": "5000000000000000000000000",
        "dexId": "Rhea"
    })
}

// the error code of an answer.
fn error_code_fun(reply: &THE_REPLY) -> String {
    reply
        .body
        .get("error")
        .and_then(|error| error.get("code"))
        .and_then(|code| code.as_str())
        .unwrap_or_default()
        .to_string()
}

// ========================================
// --- TESTS -----------------------------
#[tokio::test]
async fn a_swap_is_queued_and_read_back() {
    let db = TEMP_DB::new_fun("one");
    let pool = db.pool_fun().await;
    let api_key = put_api_key_fun(&pool, "agent.near").await;
    let base_url = serve_fun(pool).await;

    let reply = post_swap_fun(&base_url, Some(&api_key), &one_swap_body_fun()).await;
    assert_eq!(reply.status, 201);

    let swap_id = reply.body.get("swapId").and_then(|id| id.as_str()).unwrap();
    assert!(!swap_id.is_empty(), "the swap should have an id");

    // the swap comes back with the three facts it was made of.
    assert_eq!(
        reply.body.get("tokenIn").and_then(|t| t.as_str()),
        Some("usdt.tether-token.near")
    );
    assert_eq!(
        reply.body.get("amountIn").and_then(|a| a.as_str()),
        Some("100000000")
    );
    assert_eq!(
        reply.body.get("tokenOut").and_then(|t| t.as_str()),
        Some("near")
    );
    assert_eq!(
        reply.body.get("amountOut").and_then(|a| a.as_str()),
        Some("5000000000000000000000000")
    );
    assert_eq!(reply.body.get("dexId").and_then(|d| d.as_str()), Some("Rhea"));
}

#[tokio::test]
async fn the_answers_carry_the_what_the_when_and_the_why() {
    let db = TEMP_DB::new_fun("words");
    let pool = db.pool_fun().await;
    let api_key = put_api_key_fun(&pool, "agent.near").await;
    let base_url = serve_fun(pool).await;

    let reply = post_swap_fun(&base_url, Some(&api_key), &one_swap_body_fun()).await;

    assert_eq!(
        reply.body.get("what").and_then(|w| w.as_str()),
        Some("swap 100 USDC for NEAR")
    );
    assert_eq!(
        reply.body.get("when").and_then(|w| w.as_str()),
        Some("when the price is right")
    );
    assert_eq!(
        reply.body.get("why").and_then(|w| w.as_str()),
        Some("you said to move half your usdc")
    );
    assert_eq!(
        reply.body.get("whenAt").and_then(|w| w.as_i64()),
        Some(1_772_666_400_000i64)
    );
}

#[tokio::test]
async fn the_who_is_empty_when_no_account_is_named() {
    let db = TEMP_DB::new_fun("no-who");
    let pool = db.pool_fun().await;
    let api_key = put_api_key_fun(&pool, "agent.near").await;
    let base_url = serve_fun(pool).await;

    let reply = post_swap_fun(&base_url, Some(&api_key), &one_swap_body_fun()).await;

    let accounts = reply.body.get("accounts").and_then(|a| a.as_array());
    assert_eq!(accounts.map(|a| a.len()), Some(0));
}

#[tokio::test]
async fn the_named_accounts_are_the_who() {
    let db = TEMP_DB::new_fun("who");
    let pool = db.pool_fun().await;
    let api_key = put_api_key_fun(&pool, "agent.near").await;
    put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["accounts"] = json!(["alice.near"]);

    let reply = post_swap_fun(&base_url, Some(&api_key), &body).await;
    assert_eq!(reply.status, 201);

    let accounts = reply
        .body
        .get("accounts")
        .and_then(|a| a.as_array())
        .expect("there should be accounts");
    assert_eq!(accounts.len(), 1);
    assert_eq!(
        accounts[0].get("accountId").and_then(|a| a.as_str()),
        Some("alice.near")
    );
    assert_eq!(
        accounts[0].get("status").and_then(|s| s.as_str()),
        Some("pending")
    );
    assert_eq!(accounts[0].get("txHash"), Some(&Value::Null));
}

#[tokio::test]
async fn an_account_the_agent_may_not_name_is_refused() {
    let db = TEMP_DB::new_fun("naming");
    let pool = db.pool_fun().await;
    let api_key = put_api_key_fun(&pool, "agent.near").await;
    // carol has no api key at all — she is somebody else's user.
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["accounts"] = json!(["carol.near"]);

    let reply = post_swap_fun(&base_url, Some(&api_key), &body).await;
    assert_eq!(reply.status, 400);
    assert_eq!(error_code_fun(&reply), "account_not_named_by_agent");
}

#[tokio::test]
async fn a_swap_without_a_token_in_is_refused() {
    let db = TEMP_DB::new_fun("no-token-in");
    let pool = db.pool_fun().await;
    let api_key = put_api_key_fun(&pool, "agent.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["tokenIn"] = json!("   ");

    let reply = post_swap_fun(&base_url, Some(&api_key), &body).await;
    assert_eq!(reply.status, 400);
    assert_eq!(error_code_fun(&reply), "no_token_in");
}

#[tokio::test]
async fn a_swap_without_a_token_out_is_refused() {
    let db = TEMP_DB::new_fun("no-token-out");
    let pool = db.pool_fun().await;
    let api_key = put_api_key_fun(&pool, "agent.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["tokenOut"] = json!("");

    let reply = post_swap_fun(&base_url, Some(&api_key), &body).await;
    assert_eq!(reply.status, 400);
    assert_eq!(error_code_fun(&reply), "no_token_out");
}

#[tokio::test]
async fn a_swap_of_a_token_for_itself_is_refused() {
    let db = TEMP_DB::new_fun("same-token");
    let pool = db.pool_fun().await;
    let api_key = put_api_key_fun(&pool, "agent.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["tokenOut"] = body["tokenIn"].clone();

    let reply = post_swap_fun(&base_url, Some(&api_key), &body).await;
    assert_eq!(reply.status, 400);
    assert_eq!(error_code_fun(&reply), "same_token");
}

#[tokio::test]
async fn a_swap_without_an_amount_in_is_refused() {
    let db = TEMP_DB::new_fun("no-amount");
    let pool = db.pool_fun().await;
    let api_key = put_api_key_fun(&pool, "agent.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["amountIn"] = json!("");

    let reply = post_swap_fun(&base_url, Some(&api_key), &body).await;
    assert_eq!(reply.status, 400);
    assert_eq!(error_code_fun(&reply), "no_amount_in");
}

#[tokio::test]
async fn a_swap_with_a_word_for_an_amount_is_refused() {
    let db = TEMP_DB::new_fun("bad-amount");
    let pool = db.pool_fun().await;
    let api_key = put_api_key_fun(&pool, "agent.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["amountIn"] = json!("lots");

    let reply = post_swap_fun(&base_url, Some(&api_key), &body).await;
    assert_eq!(reply.status, 400);
    assert_eq!(error_code_fun(&reply), "bad_amount_in");
}

#[tokio::test]
async fn a_swap_of_nothing_is_refused() {
    let db = TEMP_DB::new_fun("zero-amount");
    let pool = db.pool_fun().await;
    let api_key = put_api_key_fun(&pool, "agent.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["amountIn"] = json!("0");

    let reply = post_swap_fun(&base_url, Some(&api_key), &body).await;
    assert_eq!(reply.status, 400);
    assert_eq!(error_code_fun(&reply), "bad_amount_in");
}

#[tokio::test]
async fn queuing_a_swap_without_an_api_key_is_refused() {
    let db = TEMP_DB::new_fun("no-key");
    let pool = db.pool_fun().await;
    let base_url = serve_fun(pool).await;

    let reply = post_swap_fun(&base_url, None, &one_swap_body_fun()).await;
    assert_eq!(reply.status, 401);
    assert_eq!(error_code_fun(&reply), "no_api_key");
}

#[tokio::test]
async fn the_list_is_open_and_needs_no_api_key() {
    let db = TEMP_DB::new_fun("list-open");
    let pool = db.pool_fun().await;
    let api_key = put_api_key_fun(&pool, "agent.near").await;
    let base_url = serve_fun(pool).await;

    post_swap_fun(&base_url, Some(&api_key), &one_swap_body_fun()).await;

    let reply = get_list_fun(&base_url, None, "").await;
    assert_eq!(reply.status, 200);
    assert_eq!(
        reply.body.get("total").and_then(|t| t.as_i64()),
        Some(1),
        "the swap should be in the list"
    );
}

#[tokio::test]
async fn one_swap_is_read_back_and_a_swap_that_is_not_there_is_a_404() {
    let db = TEMP_DB::new_fun("one-read");
    let pool = db.pool_fun().await;
    let api_key = put_api_key_fun(&pool, "agent.near").await;
    let base_url = serve_fun(pool).await;

    let posted = post_swap_fun(&base_url, Some(&api_key), &one_swap_body_fun()).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    let reply = get_one_fun(&base_url, None, &swap_id).await;
    assert_eq!(reply.status, 200);
    assert_eq!(
        reply.body.get("swapId").and_then(|id| id.as_str()),
        Some(swap_id.as_str())
    );

    let missing = get_one_fun(&base_url, None, "not-a-swap").await;
    assert_eq!(missing.status, 404);
    assert_eq!(error_code_fun(&missing), "no_such_swap");
}

#[tokio::test]
async fn the_list_filters_by_account_and_by_token() {
    let db = TEMP_DB::new_fun("list-filters");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["accounts"] = json!(["alice.near"]);
    post_swap_fun(&base_url, Some(&agent_key), &body).await;

    // the alice view has the swap. the filter is always the CALLER's own
    // account, so it is alice's key that is used.
    let alice_view = get_list_fun(&base_url, Some(&alice_key), "account_id=alice.near").await;
    assert_eq!(alice_view.body.get("total").and_then(|t| t.as_i64()), Some(1));

    // --- WHY --- THE AGENT SEES IT TOO: the account filter is the
    // account the READER NAMED, and the reader is signed in. the agent
    // is not on the swap, but the agent asked for alice's swaps and
    // alice's swaps is the answer. a filter by account is a filter BY
    // account, and the caller's own account is not quietly added to it.
    let agent_view = get_list_fun(&base_url, Some(&agent_key), "account_id=alice.near").await;
    assert_eq!(agent_view.body.get("total").and_then(|t| t.as_i64()), Some(1));

    // and the agent's OWN swaps — nobody put the agent on one — is
    // still empty.
    let agent_own = get_list_fun(&base_url, Some(&agent_key), "account_id=agent.near").await;
    assert_eq!(agent_own.body.get("total").and_then(|t| t.as_i64()), Some(0));

    // the token filters find it, in the alice view.
    let by_token = get_list_fun(&base_url, Some(&alice_key), "token_in=near").await;
    assert_eq!(by_token.body.get("total").and_then(|t| t.as_i64()), Some(0));

    let by_token_in = get_list_fun(
        &base_url,
        Some(&alice_key),
        "token_in=usdt.tether-token.near",
    )
    .await;
    assert_eq!(by_token_in.body.get("total").and_then(|t| t.as_i64()), Some(1));

    let by_token_out = get_list_fun(&base_url, Some(&alice_key), "token_out=near").await;
    assert_eq!(by_token_out.body.get("total").and_then(|t| t.as_i64()), Some(1));
}

#[tokio::test]
async fn the_list_filtered_by_an_account_needs_no_api_key() {
    let db = TEMP_DB::new_fun("list-account-key");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    // the NAMING RULE: an agent may only name accounts it holds a key
    // for, so the agent needs one for alice.
    put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["accounts"] = json!(["alice.near"]);
    post_swap_fun(&base_url, Some(&agent_key), &body).await;

    // --- WHY --- NO KEY IS NEEDED: the swap list is an OPEN offer. a
    // reader who is not signed in can already read every swap and see
    // every account on it, so filtering that public list by a name is
    // not a leak — it is the filter the reader asked for.
    let answer = get_list_fun(&base_url, None, "account_id=alice.near").await;
    assert_eq!(answer.status, 200, "body was: {}", answer.body);
    assert_eq!(answer.body["total"], 1);
}

#[tokio::test]
async fn the_list_with_hide_sent_and_no_account_id_is_refused_for_a_reader_with_no_account() {
    let db = TEMP_DB::new_fun("list-hide-sent");
    let pool = db.pool_fun().await;
    let base_url = serve_fun(pool).await;

    // --- WHY --- A READER WITH NO ACCOUNT IS REFUSED: the filter says
    // "hide what THIS account sent", and a reader who has no account
    // and named none has nothing for it to be about.
    //
    // --- WHY --- A SIGNED-IN READER IS NOT REFUSED: they have an
    // account — their own — and the filter is about that one.
    let reply = get_list_fun(&base_url, None, "hide_sent=1").await;
    assert_eq!(reply.status, 400);
    assert_eq!(error_code_fun(&reply), "hide_sent_without_account");
}

#[tokio::test]
async fn the_sent_route_writes_the_hash_the_status_and_the_amount_out() {
    let db = TEMP_DB::new_fun("sent");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["accounts"] = json!(["alice.near"]);
    let posted = post_swap_fun(&base_url, Some(&agent_key), &body).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    let reply = post_sent_fun(
        &base_url,
        &alice_key,
        &swap_id,
        &json!({
            "txHash": "abc123",
            "status": "succeeded",
            "amountOut": "4999000000000000000000000"
        }),
    )
    .await;
    assert_eq!(reply.status, 200);

    let accounts = reply
        .body
        .get("accounts")
        .and_then(|a| a.as_array())
        .expect("there should be accounts");
    let alice = accounts
        .iter()
        .find(|account| account.get("accountId").and_then(|a| a.as_str()) == Some("alice.near"))
        .expect("alice should be on the swap");

    assert_eq!(alice.get("status").and_then(|s| s.as_str()), Some("succeeded"));
    assert_eq!(alice.get("txHash").and_then(|h| h.as_str()), Some("abc123"));
    assert_eq!(
        alice.get("amountOut").and_then(|a| a.as_str()),
        Some("4999000000000000000000000")
    );
}

#[tokio::test]
async fn the_sent_route_without_a_status_records_sent() {
    let db = TEMP_DB::new_fun("sent-no-status");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["accounts"] = json!(["alice.near"]);
    let posted = post_swap_fun(&base_url, Some(&agent_key), &body).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    let reply = post_sent_fun(
        &base_url,
        &alice_key,
        &swap_id,
        &json!({ "txHash": "abc123" }),
    )
    .await;
    assert_eq!(reply.status, 200);

    let accounts = reply
        .body
        .get("accounts")
        .and_then(|a| a.as_array())
        .expect("there should be accounts");
    assert_eq!(
        accounts[0].get("status").and_then(|s| s.as_str()),
        Some("sent")
    );
}

#[tokio::test]
async fn the_sent_route_with_a_bad_status_is_refused() {
    let db = TEMP_DB::new_fun("sent-bad-status");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let posted = post_swap_fun(&base_url, Some(&agent_key), &one_swap_body_fun()).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    let reply = post_sent_fun(
        &base_url,
        &alice_key,
        &swap_id,
        &json!({ "txHash": "abc123", "status": "pending" }),
    )
    .await;
    assert_eq!(reply.status, 400);
    assert_eq!(error_code_fun(&reply), "bad_status");
}

#[tokio::test]
async fn the_sent_route_with_no_hash_is_refused() {
    let db = TEMP_DB::new_fun("sent-no-hash");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let posted = post_swap_fun(&base_url, Some(&agent_key), &one_swap_body_fun()).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    let reply = post_sent_fun(&base_url, &alice_key, &swap_id, &json!({})).await;
    assert_eq!(reply.status, 400);
    assert_eq!(error_code_fun(&reply), "no_tx_hash");
}

#[tokio::test]
async fn the_sent_route_for_a_swap_that_is_not_there_is_a_404() {
    let db = TEMP_DB::new_fun("sent-no-swap");
    let pool = db.pool_fun().await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let reply = post_sent_fun(
        &base_url,
        &alice_key,
        "not-a-swap",
        &json!({ "txHash": "abc123" }),
    )
    .await;
    assert_eq!(reply.status, 404);
    assert_eq!(error_code_fun(&reply), "no_such_swap");
}

#[tokio::test]
async fn the_sent_route_creates_the_row_for_an_account_that_was_never_named() {
    let db = TEMP_DB::new_fun("sent-join");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let bob_key = put_api_key_fun(&pool, "bob.near").await;
    let base_url = serve_fun(pool).await;

    let posted = post_swap_fun(&base_url, Some(&agent_key), &one_swap_body_fun()).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    // bob was never named on the swap. he executes it anyway, and his
    // row is created.
    let reply = post_sent_fun(
        &base_url,
        &bob_key,
        &swap_id,
        &json!({ "txHash": "def456", "status": "succeeded" }),
    )
    .await;
    assert_eq!(reply.status, 200);

    let accounts = reply
        .body
        .get("accounts")
        .and_then(|a| a.as_array())
        .expect("there should be accounts");
    let bob = accounts
        .iter()
        .find(|account| account.get("accountId").and_then(|a| a.as_str()) == Some("bob.near"))
        .expect("bob should be on the swap now");
    assert_eq!(bob.get("txHash").and_then(|h| h.as_str()), Some("def456"));
}

#[tokio::test]
async fn an_account_can_add_itself_to_a_swap() {
    let db = TEMP_DB::new_fun("add-self");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let posted = post_swap_fun(&base_url, Some(&agent_key), &one_swap_body_fun()).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    let reply = post_account_fun(&base_url, &alice_key, &swap_id, "alice.near").await;
    assert_eq!(reply.status, 200);

    let accounts = reply
        .body
        .get("accounts")
        .and_then(|a| a.as_array())
        .expect("there should be accounts");
    assert_eq!(accounts.len(), 1);
    assert_eq!(
        accounts[0].get("accountId").and_then(|a| a.as_str()),
        Some("alice.near")
    );
}

#[tokio::test]
async fn an_account_may_not_add_somebody_else_to_a_swap() {
    let db = TEMP_DB::new_fun("add-other");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let posted = post_swap_fun(&base_url, Some(&agent_key), &one_swap_body_fun()).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    let reply = post_account_fun(&base_url, &alice_key, &swap_id, "bob.near").await;
    assert_eq!(reply.status, 403);
    assert_eq!(error_code_fun(&reply), "not_your_account");
}

#[tokio::test]
async fn an_account_that_is_already_on_a_swap_is_refused() {
    let db = TEMP_DB::new_fun("add-twice");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["accounts"] = json!(["alice.near"]);
    let posted = post_swap_fun(&base_url, Some(&agent_key), &body).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    let reply = post_account_fun(&base_url, &alice_key, &swap_id, "alice.near").await;
    assert_eq!(reply.status, 409);
    assert_eq!(error_code_fun(&reply), "already_on_the_queue");
}

#[tokio::test]
async fn the_delete_route_removes_a_pending_row_but_not_a_row_with_a_hash() {
    let db = TEMP_DB::new_fun("delete");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["accounts"] = json!(["alice.near"]);
    let posted = post_swap_fun(&base_url, Some(&agent_key), &body).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    // alice sends it. the row is history now.
    post_sent_fun(
        &base_url,
        &alice_key,
        &swap_id,
        &json!({ "txHash": "abc123", "status": "succeeded" }),
    )
    .await;

    let reply = delete_account_fun(&base_url, &alice_key, &swap_id, "alice.near").await;
    assert_eq!(reply.status, 200);

    let accounts = reply
        .body
        .get("accounts")
        .and_then(|a| a.as_array())
        .expect("there should be accounts");
    assert_eq!(accounts.len(), 1, "a sent row is history and stays");
}

#[tokio::test]
async fn the_delete_route_removes_a_pending_row() {
    let db = TEMP_DB::new_fun("delete-pending");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["accounts"] = json!(["alice.near"]);
    let posted = post_swap_fun(&base_url, Some(&agent_key), &body).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    let reply = delete_account_fun(&base_url, &alice_key, &swap_id, "alice.near").await;
    assert_eq!(reply.status, 200);

    let accounts = reply
        .body
        .get("accounts")
        .and_then(|a| a.as_array())
        .expect("there should be accounts");
    assert_eq!(accounts.len(), 0);
}

#[tokio::test]
async fn the_delete_route_with_another_accounts_key_is_refused() {
    let db = TEMP_DB::new_fun("delete-other");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["accounts"] = json!(["alice.near"]);
    let posted = post_swap_fun(&base_url, Some(&agent_key), &body).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    let reply = delete_account_fun(&base_url, &alice_key, &swap_id, "bob.near").await;
    assert_eq!(reply.status, 403);
    assert_eq!(error_code_fun(&reply), "not_your_account");
}

#[tokio::test]
async fn the_delete_route_for_an_account_that_is_not_on_the_swap_is_a_404() {
    let db = TEMP_DB::new_fun("delete-not-on");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let posted = post_swap_fun(&base_url, Some(&agent_key), &one_swap_body_fun()).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    let reply = delete_account_fun(&base_url, &alice_key, &swap_id, "alice.near").await;
    assert_eq!(reply.status, 404);
    assert_eq!(error_code_fun(&reply), "not_on_the_queue");
}

#[tokio::test]
async fn the_list_with_an_account_and_hide_sent_drops_the_sent_ones() {
    let db = TEMP_DB::new_fun("hide-sent");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let alice_key = put_api_key_fun(&pool, "alice.near").await;
    let base_url = serve_fun(pool).await;

    let mut body = one_swap_body_fun();
    body["accounts"] = json!(["alice.near"]);
    let posted = post_swap_fun(&base_url, Some(&agent_key), &body).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    // before the send it is in the view.
    let before = get_list_fun(
        &base_url,
        Some(&alice_key),
        "account_id=alice.near&hide_sent=1",
    )
    .await;
    assert_eq!(before.body.get("total").and_then(|t| t.as_i64()), Some(1));

    post_sent_fun(
        &base_url,
        &alice_key,
        &swap_id,
        &json!({ "txHash": "abc123", "status": "succeeded" }),
    )
    .await;

    // after the send it is gone.
    let after = get_list_fun(
        &base_url,
        Some(&alice_key),
        "account_id=alice.near&hide_sent=1",
    )
    .await;
    assert_eq!(after.body.get("total").and_then(|t| t.as_i64()), Some(0));
}

#[tokio::test]
async fn the_swap_queue_paths_are_not_swallowed_by_another_path() {
    let db = TEMP_DB::new_fun("paths");
    let pool = db.pool_fun().await;
    let agent_key = put_api_key_fun(&pool, "agent.near").await;
    let base_url = serve_fun(pool).await;

    let posted = post_swap_fun(&base_url, Some(&agent_key), &one_swap_body_fun()).await;
    let swap_id = posted
        .body
        .get("swapId")
        .and_then(|id| id.as_str())
        .unwrap()
        .to_string();

    // the one-swap route answers with the swap, not with something else.
    let one = get_one_fun(&base_url, None, &swap_id).await;
    assert_eq!(one.status, 200);
    assert_eq!(
        one.body.get("swapId").and_then(|id| id.as_str()),
        Some(swap_id.as_str())
    );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
