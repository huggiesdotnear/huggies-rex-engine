// ========================================
// TX_QUEUE_ROUTE
// POST /api/shit-1170/tx-queue — queue a batch of transactions.
// GET  /api/shit-1170/tx-queue — the queue list, filterable.
//
// the POST is the agent's route: the agent hands over a batch of calls
// and the accounts they are for, and the backend writes the queue, one
// transaction per call, and one account row per transaction per named
// account.
//
// the GET is the feed: it is OPEN. anyone with an api key can list the
// queues, because a queue is an open offer and hiding it would defeat
// the point.
//
// 400 = the body was empty, or held more than fifty transactions, or a
// transaction had no contract id, no method, or args that were not a
// json object, or the `accounts` list named an account the agent holds
// NO api key for — the NAMING rule.
// 401 = the x-api-key header is missing, or the key is not one of ours.
// 500 = the db could not be reached.
//
// --- WHY --- ONE file holds TWO handlers: the repo's rule is one
// FUNCTION per file, and this file holds the two functions of ONE url —
// the batch you queue and the batches you can see. they are two halves
// of the same resource.
//
// --- WHY --- the NAMING RULE is the anti-spam wall: the WHO list is what
// puts a tx in somebody's feed. if an agent could name any account id
// it liked, agent A could fill agent B's users' feeds with txs they
// never asked for — and the ui filters by account, so those users would
// keep seeing them. so the agent's WHO list is its OWN users, and only
// its own users. one agent spamming another agent's users through the
// queue is exactly what this check stops.
//
// --- WHY --- the SIGNING side stays open: a user who sees a tx in their
// feed may send it, and their account joins the WHO list. that is a
// user acting for themselves with their own key — no agent is putting it
// in front of them.
//
// --- WHY --- `hide_sent` WITHOUT an account is a 400: "has this account
// sent it" is a question about ONE account. a queue can be sent by alice
// and not by bob, so there is no single answer to "has this queue been
// sent". the filter therefore names the account it is about, and
// saying so is better than quietly ignoring it and returning the whole
// list.
use axum::{
    Json,
    extract::{Query, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use sqlx::SqlitePool;

use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_accounts_store::{
    tx_queue_accounts_insert_fun, tx_queue_accounts_list_by_queue_fun,
};
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_args_fun::tx_queue_args_from_json_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_caller_fun::tx_queue_caller_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_named_accounts_fun::tx_queue_named_accounts_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_row_to_json_fun::tx_queue_row_to_json_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_status_fun::SHIT_1170_TX_QUEUE_STATUS_PENDING;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_store::{
    TX_QUEUE_LIST_QUERY, TX_QUEUE_ROW, tx_queue_get_fun, tx_queue_insert_fun, tx_queue_list_fun,
};
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_transactions_store::{
    tx_queue_transactions_insert_fun, tx_queue_transactions_list_by_queue_fun,
};
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_uuid_fun::tx_queue_uuid_fun;
use crate::backend::types::tx_queue_query::TX_QUEUE_QUERY;
use crate::backend::types::tx_queue_request::{
    TX_QUEUE_ITEM, TX_QUEUE_LIST_RESPONSE, TX_QUEUE_REQUEST, TX_QUEUE_TRANSACTION_REQUEST,
};
// ========================================
// --- CONFIG -----------------------------
// how many transactions one batch may hold.
//
// --- WHY --- fifty: the wallet signs the whole batch in ONE popup, and a
// popup with two hundred transactions is unreadable and slow.
const SHIT_1170_TX_QUEUE_MAX_TRANSACTIONS: usize = 50;

// how many batches the list answers with when no limit is given.
const SHIT_1170_TX_QUEUE_LIST_LIMIT: i64 = 50;

// the most batches one page may hold, whatever the caller asked for.
//
// --- WHY --- a limit is CLAMPED and not refused: a caller who asks for
// a thousand is not a caller to be turned away — they want a big page,
// and a big page is fine. and a NEGATIVE limit means "no limit" in
// sqlite, so it has to be clamped too, or `limit=-1` would answer with
// every queue in the db.
const SHIT_1170_TX_QUEUE_LIST_MAX_LIMIT: i64 = 500;

// where the list starts when no offset is given.
const SHIT_1170_TX_QUEUE_LIST_OFFSET: i64 = 0;
// ========================================
// --- POST -------------------------------
// queue a batch of transactions.
//
// --- WHY --- the api key comes from the HEADER: a url ends up in logs
// and in the referer of the next page, and a bearer token in a url is a
// bearer token in everybody's browser history.
pub async fn tx_queue_post_route(
    State(pool): State<SqlitePool>,
    headers: HeaderMap,
    Json(body): Json<TX_QUEUE_REQUEST>,
) -> Response {
    let account_id = match tx_queue_caller_fun(&pool, &headers).await {
        Ok(account_id) => account_id,
        Err(failure) => {
            return shit_1170_error_fun(failure.status, &failure.code, &failure.message)
                .into_response();
        }
    };

    // --- THE BATCH ------------------------
    // it must hold at least one transaction and at most fifty.
    if body.transactions.is_empty() {
        return shit_1170_error_fun(
            StatusCode::BAD_REQUEST,
            "no_transactions",
            "a queue must hold at least one transaction",
        )
        .into_response();
    }
    if body.transactions.len() > SHIT_1170_TX_QUEUE_MAX_TRANSACTIONS {
        return shit_1170_error_fun(
            StatusCode::BAD_REQUEST,
            "too_many_transactions",
            &format!(
                "a queue holds at most {} transactions",
                SHIT_1170_TX_QUEUE_MAX_TRANSACTIONS
            ),
        )
        .into_response();
    }

    // --- THE CALLS ------------------------
    // every call is checked BEFORE anything is written, so a batch that
    // is going to be refused never leaves half of itself in the db.
    let mut prepared: Vec<PREPARED_TRANSACTION> =
        Vec::with_capacity(body.transactions.len());
    for (position, transaction) in body.transactions.iter().enumerate() {
        match prepared_transaction_fun(transaction, position as i64) {
            Ok(prepared_one) => prepared.push(prepared_one),
            Err((code, message)) => {
                return shit_1170_error_fun(StatusCode::BAD_REQUEST, &code, &message)
                    .into_response();
            }
        }
    }

    // --- THE WHO --------------------------
    // the NAMING RULE. every account the agent names must be one the
    // agent holds a key for.
    let named_accounts = body.accounts.clone().unwrap_or_default();
    if !named_accounts.is_empty() {
        let allowed = match tx_queue_named_accounts_fun(&pool, &account_id, &named_accounts).await {
            Ok(allowed) => allowed,
            Err(err) => {
                eprintln!("[tx-queue] could not check the named accounts: {err}");
                return shit_1170_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "db_unavailable",
                    "the named accounts could not be checked",
                )
                .into_response();
            }
        };

        // --- WHY --- a SHORTER answer means one of them was refused, and
        // the WHOLE request is refused: naming one account you may not
        // name would still put a tx in somebody's feed. so the batch is
        // not written at all.
        if allowed.len() != named_accounts.len() {
            let refused = named_accounts
                .iter()
                .find(|account| !allowed.contains(account))
                .cloned()
                .unwrap_or_default();
            return shit_1170_error_fun(
                StatusCode::BAD_REQUEST,
                "account_not_named_by_agent",
                &format!(
                    "the agent holds no api key for {refused}, so it may not name it"
                ),
            )
            .into_response();
        }
    }

    // --- THE WRITE ------------------------
    let queue_id = tx_queue_uuid_fun();
    if let Err(err) = tx_queue_insert_fun(
        &pool,
        body.what.as_deref(),
        body.when.as_deref(),
        body.why.as_deref(),
        body.when_at,
        &queue_id,
    )
    .await
    {
        eprintln!("[tx-queue] could not write the queue: {err}");
        return shit_1170_error_fun(
            StatusCode::INTERNAL_SERVER_ERROR,
            "db_unavailable",
            "the queue could not be written",
        )
        .into_response();
    }

    let mut tx_ids: Vec<String> = Vec::with_capacity(prepared.len());
    for one in &prepared {
        let tx_id = tx_queue_uuid_fun();
        if let Err(err) = tx_queue_transactions_insert_fun(
            &pool,
            &tx_id,
            &queue_id,
            one.position,
            &one.contract_id,
            &one.method,
            &one.args,
            one.gas.as_deref(),
            one.deposit.as_deref(),
        )
        .await
        {
            eprintln!("[tx-queue] could not write the transaction: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the transaction could not be written",
            )
            .into_response();
        }
        tx_ids.push(tx_id);
    }

    // --- WHY --- one account row PER TRANSACTION per named account: the
    // account row hangs off the transaction, because each transaction
    // produces its OWN hash and the hash cannot live on the queue.
    for tx_id in &tx_ids {
        for account in &named_accounts {
            if let Err(err) = tx_queue_accounts_insert_fun(
                &pool,
                &queue_id,
                tx_id,
                account,
                SHIT_1170_TX_QUEUE_STATUS_PENDING,
            )
            .await
            {
                eprintln!("[tx-queue] could not write the account row: {err}");
                return shit_1170_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "db_unavailable",
                    "the account could not be written on the queue",
                )
                .into_response();
            }
        }
    }

    // --- THE ANSWER -----------------------
    let item = match queue_item_fun(&pool, &queue_id).await {
        Ok(item) => item,
        Err(failure) => return *failure,
    };

    (StatusCode::CREATED, Json(item)).into_response()
}

// ========================================
// --- GET --------------------------------
// the queue list.
//
// --- WHY --- the list is OPEN: anyone with an api key can list the
// queues. a queue is an open offer, and hiding it would defeat the
// point.
pub async fn tx_queue_get_route(
    State(pool): State<SqlitePool>,
    headers: HeaderMap,
    Query(query): Query<TX_QUEUE_QUERY>,
) -> Response {
    // --- WHY --- THE LIST DOES NOT ASK FOR A KEY: the queue is an OPEN
    // offer. a reader who is not signed in can still read the feed — they
    // see every batch, and they can open one. what they cannot do is act
    // on it, and the acting is what the other routes ask the key for.
    //
    // so the key is read here ONLY when the reader asked for their OWN
    // queues — the `account_id` filter and the `hide_sent` filter are
    // questions about one account, and that account has to be the
    // caller's own.
    let caller_account_id = match tx_queue_caller_fun(&pool, &headers).await {
        Ok(account_id) => Some(account_id),
        // --- WHY --- a missing or unknown key is NOT an error here: the
        // list is open. the key is only needed for the account filters,
        // and those are checked below.
        Err(failure) if failure.status == StatusCode::UNAUTHORIZED => None,
        Err(failure) => {
            return shit_1170_error_fun(failure.status, &failure.code, &failure.message)
                .into_response();
        }
    };

    // --- WHY --- `hide_sent` needs an account: "has this account sent it"
    // is a question about ONE account. a queue can be sent by alice and
    // not by bob, so there is no such question about all the accounts at
    // once. without an account the filter has nothing to be about, and
    // saying so is better than quietly ignoring it.
    let hide_sent = hide_sent_flag_fun(query.hide_sent.as_deref());
    if hide_sent == Some(true) && query.account_id.is_none() {
        return shit_1170_error_fun(
            StatusCode::BAD_REQUEST,
            "hide_sent_without_account",
            "hide_sent needs an account_id — it is a filter on one account's view",
        )
        .into_response();
    }

    // --- WHY --- THE ACCOUNT FILTER IS THE CALLER'S OWN ACCOUNT: the
    // filter says "the queues THIS account is on", and a reader who is
    // not signed in has no account. asking for somebody else's queues by
    // name is not a thing a stranger can do.
    //
    // --- WHY --- THE ACCOUNT IN THE QUERY IS IGNORED AND NOT REFUSED: the
    // reader who is signed in gets their OWN queues whatever the query
    // says. a link with another account's id in it shows the reader
    // their own feed, not somebody else's.
    let account_id = match (&caller_account_id, query.account_id.as_deref()) {
        // the reader is signed in: their own account, whatever the query
        // named.
        (Some(caller), _) => Some(caller.clone()),
        // the reader is signed out and named an account: there is nobody
        // to be "mine", so the filter cannot be answered.
        (None, Some(_)) => {
            return shit_1170_error_fun(
                StatusCode::UNAUTHORIZED,
                "no_api_key",
                "filtering by an account needs an api key",
            )
            .into_response();
        }
        // the reader is signed out and named nobody: the whole feed.
        (None, None) => None,
    };

    let list_query = TX_QUEUE_LIST_QUERY {
        account_id,
        hide_sent,
        contract_id: query.contract_id.clone(),
        method: query.method.clone(),
        limit: limit_fun(
            query.limit,
            SHIT_1170_TX_QUEUE_LIST_LIMIT,
            SHIT_1170_TX_QUEUE_LIST_MAX_LIMIT,
        ),
        offset: offset_fun(query.offset),
    };

    let (rows, total) = match tx_queue_list_fun(&pool, &list_query).await {
        Ok(found) => found,
        Err(err) => {
            eprintln!("[tx-queue] could not read the queue list: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the queue list could not be read",
            )
            .into_response();
        }
    };

    let mut items: Vec<TX_QUEUE_ITEM> = Vec::with_capacity(rows.len());
    for row in &rows {
        match queue_item_from_row_fun(&pool, row).await {
            Ok(item) => items.push(item),
            Err(failure) => return *failure,
        }
    }

    (
        StatusCode::OK,
        Json(TX_QUEUE_LIST_RESPONSE { items, total }),
    )
        .into_response()
}
// ========================================
// --- HELPERS ----------------------------
// one transaction of the batch, checked and ready to write.
//
// --- WHY --- the args must be a JSON OBJECT: the near-kit toolbox takes
// a json object of arguments, and the frontend hands the transactions
// straight to `generic_contract_call_wallet`. an array or a bare string
// is not a set of named arguments, and the call would fail on chain.
//
// --- WHY --- a missing args is an EMPTY OBJECT and not an error: a call
// with no arguments is an ordinary thing.
fn prepared_transaction_fun(
    transaction: &TX_QUEUE_TRANSACTION_REQUEST,
    position: i64,
) -> Result<PREPARED_TRANSACTION, (String, String)> {
    let contract_id = transaction.contract_id.trim();
    if contract_id.is_empty() {
        return Err((
            "no_contract_id".to_string(),
            format!("the transaction at position {position} has no contract id"),
        ));
    }

    let method = transaction.method.trim();
    if method.is_empty() {
        return Err((
            "no_method".to_string(),
            format!("the transaction at position {position} has no method"),
        ));
    }

    let args_value = match &transaction.args {
        Some(value) => value.clone(),
        None => serde_json::json!({}),
    };

    if !args_value.is_object() {
        return Err((
            "args_not_an_object".to_string(),
            format!("the args of the transaction at position {position} are not a json object"),
        ));
    }

    let args = match tx_queue_args_from_json_fun(&args_value) {
        Ok(args) => args,
        Err(err) => {
            return Err((
                "args_not_an_object".to_string(),
                format!("the args of the transaction at position {position} are not json: {err}"),
            ));
        }
    };

    Ok(PREPARED_TRANSACTION {
        position,
        contract_id: contract_id.to_string(),
        method: method.to_string(),
        args,
        gas: transaction.gas.clone(),
        deposit: transaction.deposit.clone(),
    })
}

// the page size, clamped.
//
// --- WHY --- a limit is CLAMPED and not refused: a caller who asks for
// a thousand is not a caller to be turned away — they want a big page,
// and a big page is fine. and a NEGATIVE limit means "no limit" in
// sqlite, so it has to be clamped too, or `limit=-1` would answer with
// every queue in the db.
fn limit_fun(asked: Option<i64>, default: i64, max: i64) -> i64 {
    match asked {
        None => default,
        Some(limit) if limit < 1 => default,
        Some(limit) => limit.min(max),
    }
}

// where the page starts.
//
// --- WHY --- a NEGATIVE offset is zero: sqlite treats a negative offset
// as zero anyway, and saying it here means the same thing in every
// reader.
fn offset_fun(asked: Option<i64>) -> i64 {
    match asked {
        Some(offset) if offset > 0 => offset,
        _ => SHIT_1170_TX_QUEUE_LIST_OFFSET,
    }
}

// the `hide_sent` flag, as the bool the store wants.
//
// --- WHY --- the words AND the digits are both accepted: the plan
// spells the filter `hide_sent=1`, and a url is a url — a caller who
// writes `hide_sent=1` means it. refusing it with a 422 would be a
// surprise for a filter that everybody understands.
//
// --- WHY --- anything else is NOT an error and is read as "off": the
// flag is a filter, and a filter that is switched on by accident hides
// the rows the reader came for. a value nobody understands is treated
// as "not set".
fn hide_sent_flag_fun(raw: Option<&str>) -> Option<bool> {
    let raw = raw?.trim().to_lowercase();
    match raw.as_str() {
        "1" | "true" | "yes" | "on" => Some(true),
        "0" | "false" | "no" | "off" => Some(false),
        _ => None,
    }
}

// the wire shape of one queue, read back from the db.
//
// --- WHY --- it is read back and not built from what was just written:
// the answer is then the SAME shape whether it comes from the queue
// route, the one-batch route or the list route.
async fn queue_item_fun(
    pool: &SqlitePool,
    queue_id: &str,
) -> Result<TX_QUEUE_ITEM, Box<Response>> {
    let queue = match tx_queue_get_fun(pool, queue_id).await {
        Ok(Some(queue)) => queue,
        Ok(None) => {
            return Err(Box::new(
                shit_1170_error_fun(
                    StatusCode::NOT_FOUND,
                    "no_such_queue",
                    "there is no queue with that id",
                )
                .into_response(),
            ));
        }
        Err(err) => {
            eprintln!("[tx-queue] could not read the queue: {err}");
            return Err(Box::new(
                shit_1170_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "db_unavailable",
                    "the queue could not be read",
                )
                .into_response(),
            ));
        }
    };

    queue_item_from_row_fun(pool, &queue).await
}

// the wire shape of one queue that has already been read.
async fn queue_item_from_row_fun(
    pool: &SqlitePool,
    queue: &TX_QUEUE_ROW,
) -> Result<TX_QUEUE_ITEM, Box<Response>> {
    let transactions = match tx_queue_transactions_list_by_queue_fun(pool, &queue.queue_id).await {
        Ok(transactions) => transactions,
        Err(err) => {
            eprintln!("[tx-queue] could not read the transactions: {err}");
            return Err(Box::new(
                shit_1170_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "db_unavailable",
                    "the transactions could not be read",
                )
                .into_response(),
            ));
        }
    };

    let accounts = match tx_queue_accounts_list_by_queue_fun(pool, &queue.queue_id).await {
        Ok(accounts) => accounts,
        Err(err) => {
            eprintln!("[tx-queue] could not read the accounts: {err}");
            return Err(Box::new(
                shit_1170_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "db_unavailable",
                    "the accounts could not be read",
                )
                .into_response(),
            ));
        }
    };

    match tx_queue_row_to_json_fun(queue, &transactions, &accounts) {
        Ok(item) => Ok(item),
        Err(err) => {
            eprintln!("[tx-queue] could not read the args: {err}");
            Err(Box::new(
                shit_1170_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "args_broken",
                    "the arguments of the queue could not be read",
                )
                .into_response(),
            ))
        }
    }
}

// one transaction of the batch, ready to write.
//
// --- WHY --- this is its own struct and not the request type: the
// request carries the args as a json VALUE, and the column carries them
// as a STRING. the conversion happens once, here, so the write path
// never has to think about it.
struct PREPARED_TRANSACTION {
    position: i64,
    contract_id: String,
    method: String,
    args: String,
    gas: Option<String>,
    deposit: Option<String>,
}

// the one json error shape every failure of this route answers with.
//
// --- WHY --- the same shape the trezu proxy uses, and not a new one: the
// client parses one error envelope for the whole api.
fn shit_1170_error_fun(status: StatusCode, code: &str, message: &str) -> impl IntoResponse {
    (
        status,
        Json(serde_json::json!({
          "error": {
            "code": code,
            "message": message,
          }
        })),
    )
}

// ========================================
// copyright 2026 by sleet.near
// ========================================
