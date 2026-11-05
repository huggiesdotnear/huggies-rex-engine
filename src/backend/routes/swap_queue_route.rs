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
// the GET is the feed: it is OPEN. anyone can list the swaps, because a
// queued swap is an open offer and hiding it would defeat the point.
//
// 400 = the body was empty, or named no token, or held an amount that
// is not a number, or the `accounts` list named an account the agent
// holds NO api key for — the NAMING RULE. on the GET, 400 is also a
// cursor the api did not make, and a `hide_sent` with no account to be
// about.
// 401 = the x-api-key header is missing, or the key is not one of ours.
// 500 = the db could not be reached.
//
// --- WHY --- THE GET NEVER ANSWERS A 401: the list is open, and so are
// the FILTERS over it. a reader who is not signed in can read every
// swap and see every account on it, so filtering that public list by a
// name is not a leak — it is the filter the reader asked for. the key
// is read by the GET only so the reader's OWN account is known for the
// `hide_sent` filter, and a reader who has no key names the account in
// the query instead.
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
    SWAP_QUEUE_ACCOUNT_ROW, swap_queue_accounts_insert_fun, swap_queue_accounts_list_by_swap_fun,
};
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_cursor_fun::{
    swap_queue_cursor_decode_fun, swap_queue_cursor_encode_fun,
};
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_row_to_json_fun::swap_queue_row_to_json_fun;
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_status_fun::SHIT_1170_SWAP_QUEUE_STATUS_PENDING;
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_store::{
    SWAP_QUEUE_CURSOR_POINT, SWAP_QUEUE_LIST_QUERY, SWAP_QUEUE_ROW, swap_queue_get_fun,
    swap_queue_insert_fun, swap_queue_list_fun, swap_queue_page_accounts_fun,
};
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_uuid_fun::swap_queue_uuid_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_caller_fun::tx_queue_caller_fun;
use crate::backend::logic::endpoint_shit_1170_tx_queue::tx_queue_named_accounts_fun::tx_queue_named_accounts_fun;
use crate::backend::types::shit_1170_query_list_fun::shit_1170_query_list_fun;
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
    // so the key is read here ONLY so the reader's OWN account is known
    // — the `hide_sent` filter is about the reader's own history.
    let caller_account_id = match tx_queue_caller_fun(&pool, &headers).await {
        Ok(account_id) => Some(account_id),
        // --- WHY --- a missing or unknown key is NOT an error here: the
        // list is open. the key is only needed so the reader's own
        // account can be used for the hide-sent filter, and that filter
        // is optional.
        Err(failure) if failure.status == StatusCode::UNAUTHORIZED => None,
        Err(failure) => {
            return shit_1170_error_fun(failure.status, &failure.code, &failure.message)
                .into_response();
        }
    };

    // --- THE ACCOUNT LIST ----------------
    // the accounts the filter bar picked.
    //
    // --- WHY --- THE PARAM IS COMMA SEPARATED AND NOT REPEATED: the
    // query extractor reads one value per param, and the filter bar
    // builds its query string out of a map. one comma separated string
    // carries many accounts and reads the same in a hand-written url.
    let picked_accounts = shit_1170_query_list_fun(query.account_id.as_deref());

    // --- WHY --- `hide_sent` needs an account: "has this account sent it"
    // is a question about ONE account. a swap can be sent by alice and
    // not by bob, so there is no single answer to "has this swap been
    // sent". without an account the filter has nothing to be about, and
    // saying so is better than quietly ignoring it.
    //
    // --- WHY --- EITHER THE NAMED ACCOUNT OR THE READER'S OWN COUNTS:
    // the filter says "hide what THIS account sent", and the account is
    // the one the reader named in the query — or, when the reader named
    // nobody, the reader's own account. a signed-in reader always has
    // an account to be about, so they are never refused.
    let hide_sent = hide_sent_flag_fun(query.hide_sent.as_deref());
    let hide_sent_account: Option<String> = match &caller_account_id {
        Some(caller) => Some(caller.clone()),
        None => picked_accounts.first().cloned(),
    };
    if hide_sent == Some(true) && hide_sent_account.is_none() {
        return shit_1170_error_fun(
            StatusCode::BAD_REQUEST,
            "hide_sent_without_account",
            "hide_sent needs an account_id — it is a filter on one account's view",
        )
        .into_response();
    }

    // --- WHY --- THE ACCOUNT FILTER IS THE ACCOUNT THE READER NAMED:
    // the filter says "the swaps THIS account is on", and the reader
    // picks the accounts. a reader who is signed in and picks alice
    // sees alice's swaps — that is the whole point of a filter by
    // account.
    //
    // --- WHY --- THE CALLER'S ACCOUNT IS NOT PREPENDED TO THE LIST: the
    // reader's own account going first would make the filter answer
    // "my swaps OR the ones I picked", and the reader asked for the
    // ones they picked. the reader's OWN view is the front end's job —
    // it asks for the account it wants.
    //
    // --- WHY --- NO KEY IS NEEDED FOR THE ACCOUNT FILTER: the swap list
    // is an OPEN offer. a reader who is not signed in can already read
    // every swap and see every account on it — the WHO is right there
    // on the card. so filtering that public list by a name is not a
    // leak, it is the filter the reader asked for, and the reader does
    // not have to be signed in to use it.
    let account_ids: Vec<String> = picked_accounts.clone();

    // --- THE CURSOR ----------------------
    // where the page starts.
    //
    // --- WHY --- A BAD CURSOR IS A 400 AND NOT THE FIRST PAGE: the
    // caller sent something the api does not understand, and answering
    // with the first page would show the reader the same rows twice and
    // hide the fact that their paging was broken.
    let cursor = match query.cursor.as_deref() {
        Some(raw) => match swap_queue_cursor_decode_fun(raw) {
            Ok(cursor) => Some(SWAP_QUEUE_CURSOR_POINT {
                created_at: cursor.created_at,
                swap_id: cursor.swap_id,
            }),
            Err(message) => {
                return shit_1170_error_fun(
                    StatusCode::BAD_REQUEST,
                    "bad_cursor",
                    &format!("the cursor could not be read: {message}"),
                )
                .into_response();
            }
        },
        None => None,
    };

    // --- THE HIDE-SENT ACCOUNT ------------
    // the account the `hide_sent` filter is about — worked out above,
    // so the refusal and the filter always agree.

    let list_query = SWAP_QUEUE_LIST_QUERY {
        account_ids,
        hide_sent,
        hide_sent_account,
        token_in: query.token_in.clone(),
        token_out: query.token_out.clone(),
        cursor,
        limit: limit_fun(
            query.limit,
            SHIT_1170_SWAP_QUEUE_LIST_LIMIT,
            SHIT_1170_SWAP_QUEUE_LIST_MAX_LIMIT,
        ),
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

    // --- THE WHO -------------------------
    // the account rows of every swap on the page, in ONE read.
    //
    // --- WHY --- THIS IS ONE READ AND NOT ONE READ PER SWAP: reading
    // them per swap is one query per swap, and a page of a hundred is a
    // hundred queries. reading them for the WHOLE page at once is one
    // query, whatever the page holds.
    let swap_ids: Vec<String> = rows.iter().map(|row| row.swap_id.clone()).collect();
    let page_accounts = match swap_queue_page_accounts_fun(&pool, &swap_ids).await {
        Ok(found) => found,
        Err(err) => {
            eprintln!("[swap-queue] could not read the page accounts: {err}");
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
        let empty_accounts: Vec<SWAP_QUEUE_ACCOUNT_ROW> = Vec::new();
        let accounts = page_accounts.get(&row.swap_id).unwrap_or(&empty_accounts);
        items.push(swap_queue_row_to_json_fun(row, accounts));
    }

    // --- THE NEXT CURSOR -----------------
    // the cursor of the page after this one.
    //
    // --- WHY --- IT IS ONLY HANDED OUT WHEN THE PAGE IS FULL: a page
    // that came back short is the LAST page, and handing out a cursor
    // for it would send the reader off to look for rows that are not
    // there.
    let next_cursor = match rows.last() {
        Some(last) if rows.len() as i64 >= list_query.limit => {
            Some(swap_queue_cursor_encode_fun(last.created_at, &last.swap_id))
        }
        _ => None,
    };

    (
        StatusCode::OK,
        Json(SWAP_QUEUE_LIST_RESPONSE {
            items,
            total,
            next_cursor,
        }),
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
