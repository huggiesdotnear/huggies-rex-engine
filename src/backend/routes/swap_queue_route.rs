// ========================================
// SWAP_QUEUE_ROUTE
// POST /api/shit-1170/swap-queue — queue a SWAP.
// GET  /api/shit-1170/swap-queue — the swap list, filterable.
//
// the POST is the agent's route: the agent hands over the token in, the
// amount in and the token out, and the accounts the swap is for, and the
// backend writes the swap and one account row per named account.
//
// --- WHY --- THE AGENT DOES NOT SEND A ROUTE: the route is what the
// DEXES do, and the dexes move every block. a route quoted when the
// agent queued the swap is a route for a pool state that is gone. so the
// agent names the swap and the route is worked out when it is executed
// and quoted live on the feed.
//
// the GET is the feed: it is OPEN. anyone with an api key can list the
// swaps, because a queued swap is an open offer and hiding it would
// defeat the point.
//
// 400 = the body was empty, or named no token, or held an amount that
// is not a number, or the `accounts` list named an account the agent
// holds NO api key for — the NAMING RULE.
// 401 = the x-api-key header is missing, or the key is not one of ours.
// 500 = the db could not be reached.
//
// --- WHY --- ONE file holds TWO handlers: the repo's rule is one
// FUNCTION per file, and this file holds the two functions of ONE url —
// the swap you queue and the swaps you can see. they are two halves of
// the same resource.
use axum::{
    Json,
    extract::{Query, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use sqlx::SqlitePool;

use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_accounts_store::{
    swap_queue_accounts_insert_fun, swap_queue_accounts_list_by_swap_fun,
};
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_row_to_json_fun::swap_queue_row_to_json_fun;
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_status_fun::SHIT_1170_SWAP_QUEUE_STATUS_PENDING;
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_store::{
    SWAP_QUEUE_LIST_QUERY, SWAP_QUEUE_ROW, swap_queue_get_fun, swap_queue_insert_fun,
    swap_queue_list_fun,
};
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_uuid_fun::swap_queue_uuid_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_caller_fun::tx_queue_caller_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_named_accounts_fun::tx_queue_named_accounts_fun;
use crate::backend::types::swap_queue_query::SWAP_QUEUE_QUERY;
use crate::backend::types::swap_queue_request::{
    SWAP_QUEUE_ITEM, SWAP_QUEUE_LIST_RESPONSE, SWAP_QUEUE_REQUEST,
};
// ========================================
// --- CONFIG -----------------------------
// how many swaps the list answers with when no limit is given.
const SHIT_1170_SWAP_QUEUE_LIST_LIMIT: i64 = 50;

// the most swaps one page may hold, whatever the caller asked for.
//
// --- WHY --- a limit is CLAMPED and not refused: a caller who asks for
// a thousand is not a caller to be turned away — they want a big page,
// and a big page is fine. and a NEGATIVE limit means "no limit" in
// sqlite, so it has to be clamped too, or `limit=-1` would answer with
// every swap in the db.
const SHIT_1170_SWAP_QUEUE_LIST_MAX_LIMIT: i64 = 500;

// where the list starts when no offset is given.
const SHIT_1170_SWAP_QUEUE_LIST_OFFSET: i64 = 0;
// ========================================
// --- POST -------------------------------
// queue a swap.
//
// --- WHY --- the api key comes from the HEADER: a url ends up in logs
// and in the referer of the next page, and a bearer token in a url is a
// bearer token in everybody's browser history.
pub async fn swap_queue_post_route(
    State(pool): State<SqlitePool>,
    headers: HeaderMap,
    Json(body): Json<SWAP_QUEUE_REQUEST>,
) -> Response {
    let account_id = match tx_queue_caller_fun(&pool, &headers).await {
        Ok(account_id) => account_id,
        Err(failure) => {
            return shit_1170_error_fun(failure.status, &failure.code, &failure.message)
                .into_response();
        }
    };

    // --- THE SWAP -------------------------
    // the three facts the swap is made of. they are checked BEFORE
    // anything is written, so a swap that is going to be refused never
    // leaves half of itself in the db.
    let prepared = match prepared_swap_fun(&body) {
        Ok(prepared) => prepared,
        Err((code, message)) => {
            return shit_1170_error_fun(StatusCode::BAD_REQUEST, &code, &message)
                .into_response();
        }
    };

    // --- THE WHO --------------------------
    // the NAMING RULE. every account the agent names must be one the
    // agent holds a key for.
    let named_accounts = body.accounts.clone().unwrap_or_default();
    if !named_accounts.is_empty() {
        let allowed = match tx_queue_named_accounts_fun(&pool, &account_id, &named_accounts).await {
            Ok(allowed) => allowed,
            Err(err) => {
                eprintln!("[swap-queue] could not check the named accounts: {err}");
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
        // name would still put a swap in somebody's feed. so the swap is
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
    let swap_id = swap_queue_uuid_fun();
    if let Err(err) = swap_queue_insert_fun(
        &pool,
        &swap_id,
        body.what.as_deref(),
        body.when.as_deref(),
        body.why.as_deref(),
        body.when_at,
        &prepared.token_in,
        &prepared.amount_in,
        &prepared.token_out,
        prepared.amount_out.as_deref(),
        prepared.dex_id.as_deref(),
    )
    .await
    {
        eprintln!("[swap-queue] could not write the swap: {err}");
        return shit_1170_error_fun(
            StatusCode::INTERNAL_SERVER_ERROR,
            "db_unavailable",
            "the swap could not be written",
        )
        .into_response();
    }

    // --- WHY --- ONE account row PER named account: a queued swap is ONE
    // swap, so the account row hangs off the swap and not off a
    // transaction. the truth about "who sent this" is one row per
    // account.
    for account in &named_accounts {
        if let Err(err) = swap_queue_accounts_insert_fun(
            &pool,
            &swap_id,
            account,
            SHIT_1170_SWAP_QUEUE_STATUS_PENDING,
        )
        .await
        {
            eprintln!("[swap-queue] could not write the account row: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the account could not be written on the swap",
            )
            .into_response();
        }
    }

    // --- THE ANSWER -----------------------
    let item = match swap_item_fun(&pool, &swap_id).await {
        Ok(item) => item,
        Err(failure) => return *failure,
    };

    (StatusCode::CREATED, Json(item)).into_response()
}

// ========================================
// --- GET --------------------------------
// the swap list.
//
// --- WHY --- the list is OPEN: anyone with an api key can list the
// swaps. a queued swap is an open offer, and hiding it would defeat the
// point.
pub async fn swap_queue_get_route(
    State(pool): State<SqlitePool>,
    headers: HeaderMap,
    Query(query): Query<SWAP_QUEUE_QUERY>,
) -> Response {
    // --- WHY --- THE LIST DOES NOT ASK FOR A KEY: the swap queue is an
    // OPEN offer. a reader who is not signed in can still read the feed —
    // they see every swap, and they can open one. what they cannot do is
    // act on it, and the acting is what the other routes ask the key
    // for.
    //
    // so the key is read here ONLY when the reader asked for their OWN
    // swaps — the `account_id` filter and the `hide_sent` filter are
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
    // is a question about ONE account. a swap can be sent by alice and
    // not by bob, so there is no single answer to "has this swap been
    // sent". without an account the filter has nothing to be about, and
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
    // filter says "the swaps THIS account is on", and a reader who is
    // not signed in has no account. asking for somebody else's swaps by
    // name is not a thing a stranger can do.
    //
    // --- WHY --- THE ACCOUNT IN THE QUERY IS IGNORED AND NOT REFUSED: the
    // reader who is signed in gets their OWN swaps whatever the query
    // says. a link with another account's id in it shows the reader their
    // own feed, not somebody else's.
    let account_id = match (&caller_account_id, query.account_id.as_deref()) {
        (Some(caller), _) => Some(caller.clone()),
        (None, Some(_)) => {
            return shit_1170_error_fun(
                StatusCode::UNAUTHORIZED,
                "no_api_key",
                "filtering by an account needs an api key",
            )
            .into_response();
        }
        (None, None) => None,
    };

    let list_query = SWAP_QUEUE_LIST_QUERY {
        account_id,
        hide_sent,
        token_in: query.token_in.clone(),
        token_out: query.token_out.clone(),
        limit: limit_fun(
            query.limit,
            SHIT_1170_SWAP_QUEUE_LIST_LIMIT,
            SHIT_1170_SWAP_QUEUE_LIST_MAX_LIMIT,
        ),
        offset: offset_fun(query.offset),
    };

    let (rows, total) = match swap_queue_list_fun(&pool, &list_query).await {
        Ok(found) => found,
        Err(err) => {
            eprintln!("[swap-queue] could not read the swap list: {err}");
            return shit_1170_error_fun(
                StatusCode::INTERNAL_SERVER_ERROR,
                "db_unavailable",
                "the swap list could not be read",
            )
            .into_response();
        }
    };

    let mut items: Vec<SWAP_QUEUE_ITEM> = Vec::with_capacity(rows.len());
    for row in &rows {
        match swap_item_from_row_fun(&pool, row).await {
            Ok(item) => items.push(item),
            Err(failure) => return *failure,
        }
    }

    (
        StatusCode::OK,
        Json(SWAP_QUEUE_LIST_RESPONSE { items, total }),
    )
        .into_response()
}
// ========================================
// --- HELPERS ----------------------------
// one swap, checked and ready to write.
//
// --- WHY --- THE TOKENS MUST NOT BE THE SAME: a swap of a token for
// itself is not a trade, and the router has no route for it.
//
// --- WHY --- THE AMOUNT MUST BE A NUMBER: the amount is the token's
// smallest unit and it is compared and traded as one, so a word in there
// would fail on the router and not here.
//
// --- WHY --- A ZERO AMOUNT IS REFUSED: a zero amount is not a trade.
// the tx queue refuses an empty batch for the same reason — there is
// nothing to do.
fn prepared_swap_fun(body: &SWAP_QUEUE_REQUEST) -> Result<PREPARED_SWAP, (String, String)> {
    let token_in = body.token_in.trim();
    if token_in.is_empty() {
        return Err((
            "no_token_in".to_string(),
            "the swap has no token in".to_string(),
        ));
    }

    let token_out = body.token_out.trim();
    if token_out.is_empty() {
        return Err((
            "no_token_out".to_string(),
            "the swap has no token out".to_string(),
        ));
    }

    if token_in == token_out {
        return Err((
            "same_token".to_string(),
            "the swap sells a token for itself".to_string(),
        ));
    }

    let amount_in = body.amount_in.trim();
    if amount_in.is_empty() {
        return Err((
            "no_amount_in".to_string(),
            "the swap has no amount in".to_string(),
        ));
    }
    if !amount_in.chars().all(|character| character.is_ascii_digit()) {
        return Err((
            "bad_amount_in".to_string(),
            "the amount in is not a whole number of the token's smallest unit".to_string(),
        ));
    }
    if amount_in == "0" {
        return Err((
            "bad_amount_in".to_string(),
            "the amount in is zero, and a swap of nothing is not a trade".to_string(),
        ));
    }

    // the quoted amount out is checked the same way when it is there.
    let amount_out = match body.amount_out.as_deref().map(str::trim) {
        None | Some("") => None,
        Some(raw) => {
            if !raw.chars().all(|character| character.is_ascii_digit()) {
                return Err((
                    "bad_amount_out".to_string(),
                    "the amount out is not a whole number of the token's smallest unit"
                        .to_string(),
                ));
            }
            Some(raw.to_string())
        }
    };

    let dex_id = match body.dex_id.as_deref().map(str::trim) {
        None | Some("") => None,
        Some(raw) => Some(raw.to_string()),
    };

    Ok(PREPARED_SWAP {
        token_in: token_in.to_string(),
        amount_in: amount_in.to_string(),
        token_out: token_out.to_string(),
        amount_out,
        dex_id,
    })
}

// the page size, clamped.
//
// --- WHY --- a limit is CLAMPED and not refused: a caller who asks for
// a thousand is not a caller to be turned away — they want a big page,
// and a big page is fine. and a NEGATIVE limit means "no limit" in
// sqlite, so it has to be clamped too.
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
        _ => SHIT_1170_SWAP_QUEUE_LIST_OFFSET,
    }
}

// the `hide_sent` flag, as the bool the store wants.
//
// --- WHY --- the words AND the digits are both accepted: a url is a url —
// a caller who writes `hide_sent=1` means it.
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

// the wire shape of one swap, read back from the db.
//
// --- WHY --- it is read back and not built from what was just written:
// the answer is then the SAME shape whether it comes from the swap
// route, the one-swap route or the list route.
async fn swap_item_fun(pool: &SqlitePool, swap_id: &str) -> Result<SWAP_QUEUE_ITEM, Box<Response>> {
    let swap = match swap_queue_get_fun(pool, swap_id).await {
        Ok(Some(swap)) => swap,
        Ok(None) => {
            return Err(Box::new(
                shit_1170_error_fun(
                    StatusCode::NOT_FOUND,
                    "no_such_swap",
                    "there is no swap with that id",
                )
                .into_response(),
            ));
        }
        Err(err) => {
            eprintln!("[swap-queue] could not read the swap: {err}");
            return Err(Box::new(
                shit_1170_error_fun(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "db_unavailable",
                    "the swap could not be read",
                )
                .into_response(),
            ));
        }
    };

    swap_item_from_row_fun(pool, &swap).await
}

// the wire shape of one swap that has already been read.
async fn swap_item_from_row_fun(
    pool: &SqlitePool,
    swap: &SWAP_QUEUE_ROW,
) -> Result<SWAP_QUEUE_ITEM, Box<Response>> {
    let accounts = match swap_queue_accounts_list_by_swap_fun(pool, &swap.swap_id).await {
        Ok(accounts) => accounts,
        Err(err) => {
            eprintln!("[swap-queue] could not read the accounts: {err}");
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

    Ok(swap_queue_row_to_json_fun(swap, &accounts))
}

// one swap, ready to write.
//
// --- WHY --- this is its own struct and not the request type: the
// request carries its fields as they came off the wire, and the write
// path wants them trimmed and checked. the conversion happens once,
// here, so the write path never has to think about it.
struct PREPARED_SWAP {
    token_in: String,
    amount_in: String,
    token_out: String,
    amount_out: Option<String>,
    dex_id: Option<String>,
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
