// ========================================
// TX_QUEUE_FACETS_STORE
// the two lists the feed's filter bar is built from: the CONTRACTS that
// have queued transactions, and the ACCOUNTS that have queued ones.
//
// --- WHY --- THE BAR NEEDS THESE AND NOT THE WHOLE LIST: the filter bar
// offers a button for each contract and each account, and the reader
// picks from the ones that are actually there. the bar cannot show a
// button for a contract that has no queued work, and it cannot know
// which contracts those are without asking.
//
// --- WHY --- THE TWO LISTS ARE COUNTED AND NOT JUST NAMED: a bar with
// forty accounts on it is a wall of buttons, and the reader cannot tell
// which one is the busy one. the count says how much is behind each
// button, and the bar can show the busy ones first.
//
// --- WHY --- THE COUNTS ARE OVER THE WHOLE QUEUE AND NOT OVER THE
// READER'S VIEW: the bar says what is out there to filter, and a reader
// who cannot see a queue cannot filter for it either.
use sqlx::{Row, SqlitePool};
// ========================================
// --- TYPES ------------------------------
// one contract in the facet list.
#[derive(Debug, Clone)]
pub struct TX_QUEUE_FACET_CONTRACT {
    // the contract.
    pub contract_id: String,
    // how many queued transactions call it.
    pub count: i64,
}

// one account in the facet list.
#[derive(Debug, Clone)]
pub struct TX_QUEUE_FACET_ACCOUNT {
    // the account.
    pub account_id: String,
    // how many queued batches it is on.
    pub count: i64,
}
// ========================================
// --- CONTRACTS -------------------------
// the contracts that have queued transactions, the busiest first.
//
// --- WHY --- IT READS THE TRANSACTIONS AND NOT THE QUEUES: the
// contract is a property of a TRANSACTION, and a batch of three calls
// can hit three different contracts. counting the batches would say how
// many batches touch a contract, and counting the calls says how much
// work is aimed at it — which is what the reader is choosing between.
//
// --- WHY --- IT JOINS THE QUEUES: a transaction whose batch was deleted
// is a row with nothing behind it, and the bar must not offer a filter
// that matches nothing.
pub async fn tx_queue_facet_contracts_fun(
    pool: &SqlitePool,
    limit: i64,
) -> Result<Vec<TX_QUEUE_FACET_CONTRACT>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT t.contract_id AS contract_id, COUNT(1) AS count
       FROM tx_queue_transactions t
       JOIN tx_queue q ON q.queue_id = t.queue_id
      GROUP BY t.contract_id
      ORDER BY count DESC, t.contract_id ASC
      LIMIT ?1",
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .iter()
        .map(|row| TX_QUEUE_FACET_CONTRACT {
            contract_id: row.get("contract_id"),
            count: row.get("count"),
        })
        .collect())
}

// ========================================
// --- ACCOUNTS --------------------------
// the accounts that have queued transactions, the busiest first.
//
// --- WHY --- IT COUNTS THE BATCHES AND NOT THE ACCOUNT ROWS: an account
// is on a batch once, but it has one account row per transaction of that
// batch. a batch of three calls is one thing the account is on, and the
// bar is about which things an account is waiting for.
//
// --- WHY --- THE DISTINCT IS ON THE BATCH: three rows for one batch are
// one account on one batch, and counting the rows would make a batch of
// three calls look busier than three batches of one call.
pub async fn tx_queue_facet_accounts_fun(
    pool: &SqlitePool,
    limit: i64,
) -> Result<Vec<TX_QUEUE_FACET_ACCOUNT>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT a.account_id AS account_id, COUNT(DISTINCT a.queue_id) AS count
       FROM tx_queue_accounts a
       JOIN tx_queue q ON q.queue_id = a.queue_id
      GROUP BY a.account_id
      ORDER BY count DESC, a.account_id ASC
      LIMIT ?1",
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .iter()
        .map(|row| TX_QUEUE_FACET_ACCOUNT {
            account_id: row.get("account_id"),
            count: row.get("count"),
        })
        .collect())
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
