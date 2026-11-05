// ========================================
// the swap queue store, tested against a real sqlite file.
//
// the db is a temp file, not an in-memory one, because the production db
// is a file and the two can differ: WAL, the journal mode, and the way
// sqlite writes pages are all file behaviours.
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_accounts_store::swap_queue_accounts_insert_fun;
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_status_fun::SHIT_1170_SWAP_QUEUE_STATUS_PENDING;
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_store::{
    SWAP_QUEUE_LIST_QUERY, swap_queue_insert_fun, swap_queue_list_fun,
};
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_uuid_fun::swap_queue_uuid_fun;
// ========================================
// --- HELPERS ----------------------------
// a temp db file, removed when the guard is dropped.
struct TEMP_DB {
    path: std::path::PathBuf,
}

impl TEMP_DB {
    fn new_fun(name: &str) -> Self {
        let mut path = std::env::temp_dir();
        // --- WHY --- the prefix says WHICH test file this db belongs to:
        // the swap route test uses the same `name` values, and two test
        // files that pick the same file name delete each other's db out
        // from under each other.
        path.push(format!(
            "shit-1170-swap-store-{name}-{:?}.db",
            std::process::id()
        ));
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

// a queued swap of one token for another, and its id.
async fn make_swap_fun(pool: &sqlx::SqlitePool, token_in: &str, token_out: &str) -> String {
    let swap_id = swap_queue_uuid_fun();
    swap_queue_insert_fun(
        pool,
        &swap_id,
        Some("a swap"),
        None,
        None,
        None,
        token_in,
        "100",
        token_out,
        None,
        None,
    )
    .await
    .expect("the swap should save");
    swap_id
}

// the list with no filters.
fn all_swaps_query_fun() -> SWAP_QUEUE_LIST_QUERY {
    SWAP_QUEUE_LIST_QUERY {
        account_ids: Vec::new(),
        hide_sent: None,
        hide_sent_account: None,
        token_in: None,
        token_out: None,
        contract_ids: Vec::new(),
        cursor: None,
        limit: 50,
    }
}
// ========================================
// --- TESTS -----------------------------
#[tokio::test]
async fn the_contract_filter_matches_a_swap_that_sells_the_contract() {
    let db = TEMP_DB::new_fun("contract-in");
    let pool = db.pool_fun().await;

    let sells_usdt = make_swap_fun(&pool, "usdt.tether-token.near", "wrap.near").await;
    make_swap_fun(&pool, "wrap.near", "ref.finance.near").await;

    let query = SWAP_QUEUE_LIST_QUERY {
        contract_ids: vec!["usdt.tether-token.near".to_string()],
        ..all_swaps_query_fun()
    };

    let (items, total) = swap_queue_list_fun(&pool, &query)
        .await
        .expect("the list should read");
    assert_eq!(total, 1, "only the swap that sells usdt matches");
    assert_eq!(items.len(), 1);
    assert_eq!(items[0].swap_id, sells_usdt);
}

#[tokio::test]
async fn the_contract_filter_matches_a_swap_that_buys_the_contract() {
    let db = TEMP_DB::new_fun("contract-out");
    let pool = db.pool_fun().await;

    let buys_usdt = make_swap_fun(&pool, "ref.finance.near", "usdt.tether-token.near").await;
    // a swap that touches neither usdt nor ref — it buys wrap.
    make_swap_fun(&pool, "nft.near", "wrap.near").await;

    let query = SWAP_QUEUE_LIST_QUERY {
        contract_ids: vec!["usdt.tether-token.near".to_string()],
        ..all_swaps_query_fun()
    };

    let (items, total) = swap_queue_list_fun(&pool, &query)
        .await
        .expect("the list should read");
    assert_eq!(total, 1, "only the swap that buys usdt matches");
    assert_eq!(items.len(), 1);
    assert_eq!(items[0].swap_id, buys_usdt);
}

#[tokio::test]
async fn a_swap_with_neither_picked_contract_is_not_shown() {
    let db = TEMP_DB::new_fun("contract-neither");
    let pool = db.pool_fun().await;

    make_swap_fun(&pool, "wrap.near", "ref.finance.near").await;

    let query = SWAP_QUEUE_LIST_QUERY {
        contract_ids: vec!["usdt.tether-token.near".to_string()],
        ..all_swaps_query_fun()
    };

    let (items, total) = swap_queue_list_fun(&pool, &query)
        .await
        .expect("the list should read");
    assert_eq!(
        total, 0,
        "a swap that touches neither contract is not shown"
    );
    assert!(items.is_empty());
}

#[tokio::test]
async fn the_contract_filter_takes_several_contracts_at_once() {
    let db = TEMP_DB::new_fun("contract-many");
    let pool = db.pool_fun().await;

    let sells_usdt = make_swap_fun(&pool, "usdt.tether-token.near", "wrap.near").await;
    let buys_ref = make_swap_fun(&pool, "wrap.near", "ref.finance.near").await;
    make_swap_fun(&pool, "wrap.near", "nft.near").await;

    let query = SWAP_QUEUE_LIST_QUERY {
        contract_ids: vec![
            "usdt.tether-token.near".to_string(),
            "ref.finance.near".to_string(),
        ],
        ..all_swaps_query_fun()
    };

    let (items, total) = swap_queue_list_fun(&pool, &query)
        .await
        .expect("the list should read");
    assert_eq!(total, 2, "usdt OR ref is two swaps");
    assert_eq!(items.len(), 2);
    assert!(items.iter().any(|one| one.swap_id == sells_usdt));
    assert!(items.iter().any(|one| one.swap_id == buys_ref));
}

#[tokio::test]
async fn the_total_of_the_contract_filter_counts_the_same_swaps_the_list_shows() {
    let db = TEMP_DB::new_fun("contract-total");
    let pool = db.pool_fun().await;

    // three swaps touch usdt — one sells it and two buy it — and one
    // does not.
    make_swap_fun(&pool, "usdt.tether-token.near", "wrap.near").await;
    make_swap_fun(&pool, "wrap.near", "usdt.tether-token.near").await;
    make_swap_fun(&pool, "ref.finance.near", "usdt.tether-token.near").await;
    make_swap_fun(&pool, "wrap.near", "ref.finance.near").await;

    let query = SWAP_QUEUE_LIST_QUERY {
        contract_ids: vec!["usdt.tether-token.near".to_string()],
        ..all_swaps_query_fun()
    };

    let (items, total) = swap_queue_list_fun(&pool, &query)
        .await
        .expect("the list should read");
    assert_eq!(total, 3, "the total counts the swaps that touch usdt");
    assert_eq!(
        items.len() as i64,
        total,
        "the total and the items must agree about what matched"
    );
}

#[tokio::test]
async fn the_contract_filter_and_the_token_filters_together_narrow_the_list() {
    let db = TEMP_DB::new_fun("contract-and-token");
    let pool = db.pool_fun().await;

    // sells usdt for wrap.
    make_swap_fun(&pool, "usdt.tether-token.near", "wrap.near").await;
    // sells usdt for ref.
    make_swap_fun(&pool, "usdt.tether-token.near", "ref.finance.near").await;

    // the contract list narrows to the swaps that touch usdt, and the
    // token filter narrows further to the ones that BUY wrap.
    let query = SWAP_QUEUE_LIST_QUERY {
        contract_ids: vec!["usdt.tether-token.near".to_string()],
        token_out: Some("wrap.near".to_string()),
        ..all_swaps_query_fun()
    };

    let (items, total) = swap_queue_list_fun(&pool, &query)
        .await
        .expect("the list should read");
    assert_eq!(total, 1, "one swap buys wrap and touches usdt");
    assert_eq!(items.len(), 1);
    assert_eq!(items[0].token_out, "wrap.near");
}

#[tokio::test]
async fn the_token_filters_still_work_on_their_own() {
    let db = TEMP_DB::new_fun("token-alone");
    let pool = db.pool_fun().await;

    make_swap_fun(&pool, "usdt.tether-token.near", "wrap.near").await;
    make_swap_fun(&pool, "wrap.near", "ref.finance.near").await;

    let by_in = SWAP_QUEUE_LIST_QUERY {
        token_in: Some("usdt.tether-token.near".to_string()),
        ..all_swaps_query_fun()
    };
    let (items, total) = swap_queue_list_fun(&pool, &by_in)
        .await
        .expect("the list should read");
    assert_eq!(
        total, 1,
        "the token in filter still finds the swap that sells it"
    );
    assert_eq!(items[0].token_in, "usdt.tether-token.near");

    let by_out = SWAP_QUEUE_LIST_QUERY {
        token_out: Some("wrap.near".to_string()),
        ..all_swaps_query_fun()
    };
    let (items, total) = swap_queue_list_fun(&pool, &by_out)
        .await
        .expect("the list should read");
    assert_eq!(
        total, 1,
        "the token out filter still finds the swap that buys it"
    );
    assert_eq!(items[0].token_out, "wrap.near");
}

#[tokio::test]
async fn the_contract_filter_binds_the_same_list_to_both_sides_of_the_or() {
    // --- WHY --- THIS TEST IS ABOUT THE BINDING AND NOT ABOUT THE
    // FILTER: the clause binds the picked contracts TWICE — once for
    // the token in and once for the token out — and the numbered
    // placeholders have to line up with the values in that order. a
    // mismatch would show a swap that touches one picked contract
    // through the WRONG side, and the count would still look right.
    let db = TEMP_DB::new_fun("contract-or");
    let pool = db.pool_fun().await;

    // a swap of usdt for wrap, and a swap of wrap for ref.
    make_swap_fun(&pool, "usdt.tether-token.near", "wrap.near").await;
    make_swap_fun(&pool, "wrap.near", "ref.finance.near").await;

    // picking wrap on its own matches the FIRST swap through its token
    // out and the SECOND through its token in — so both sides of the
    // `OR` are carrying the picked list.
    let query = SWAP_QUEUE_LIST_QUERY {
        contract_ids: vec!["wrap.near".to_string()],
        ..all_swaps_query_fun()
    };
    let (items, total) = swap_queue_list_fun(&pool, &query)
        .await
        .expect("the list should read");
    assert_eq!(
        total, 2,
        "wrap is on one swap's token out and another's token in"
    );
    assert_eq!(items.len(), 2);

    // and a contract that is on NEITHER side of NEITHER swap matches
    // nothing — which is what a swapped binding would break.
    let other = SWAP_QUEUE_LIST_QUERY {
        contract_ids: vec!["ref.finance.near".to_string()],
        ..all_swaps_query_fun()
    };
    let (items, total) = swap_queue_list_fun(&pool, &other)
        .await
        .expect("the list should read");
    assert_eq!(total, 1, "ref is only on the second swap's token out");
    assert_eq!(items.len(), 1);
    assert_eq!(items[0].token_out, "ref.finance.near");
}

#[tokio::test]
async fn the_contract_filter_works_alongside_the_account_filter() {
    let db = TEMP_DB::new_fun("contract-account");
    let pool = db.pool_fun().await;

    let alice_swap = make_swap_fun(&pool, "usdt.tether-token.near", "wrap.near").await;
    let bob_swap = make_swap_fun(&pool, "wrap.near", "usdt.tether-token.near").await;

    swap_queue_accounts_insert_fun(
        &pool,
        &alice_swap,
        "alice.near",
        SHIT_1170_SWAP_QUEUE_STATUS_PENDING,
    )
    .await
    .expect("the account row should save");
    swap_queue_accounts_insert_fun(
        &pool,
        &bob_swap,
        "bob.near",
        SHIT_1170_SWAP_QUEUE_STATUS_PENDING,
    )
    .await
    .expect("the account row should save");

    let query = SWAP_QUEUE_LIST_QUERY {
        account_ids: vec!["alice.near".to_string()],
        contract_ids: vec!["usdt.tether-token.near".to_string()],
        ..all_swaps_query_fun()
    };

    let (items, total) = swap_queue_list_fun(&pool, &query)
        .await
        .expect("the list should read");
    assert_eq!(
        total, 1,
        "alice's swap touches usdt and bob's does not count"
    );
    assert_eq!(items.len(), 1);
    assert_eq!(items[0].swap_id, alice_swap);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
