// ========================================
// the account page's transactions: the loading of one account's
// transaction history.
//
// read this file to know what the account page requests.
//
// WHAT THE PAGE REQUESTS
//   1. POST /v0/account   the account's transaction history, one page
//                          at a time, from the fastnear tx api
//
// THE CACHE
// --- an account's history only grows. a transaction that has happened
// stays happened, so the rows that were fetched last time are still
// true. the cache holds them, and a later visit shows them straight
// away while the new ones are fetched on top.
//
// --- WHY THE CACHE IS NOT A SUBSTITUTE FOR THE API: a cache that is
// only ever read would never learn about a new transaction. the api is
// always asked for the first page, so the top of the list is always
// current; the cache saves the WORK of asking for the pages below it,
// and covers the moment before the api answers.
import { api_account } from "@sleet-js/fastnear-explorer-api-client";
import { HUGGIES_ACCOUNT_TX_CACHE } from "./app_page_account_transactions_cache";
import type { HUGGIES_CACHED_ACCOUNT_TX_ROW } from "./app_page_account_transactions_cache";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how many rows one page of the history is.
//
// --- WHY 50: the api takes up to 100, and the table shows the newest
// rows first. 50 is enough to fill the scroll box several times over
// without making the first answer slow.
const HUGGIES_ACCOUNT_TX_PAGE_SIZE = 50;
// how many rows the cache keeps for one account.
//
// --- WHY --- THE CACHE IS CAPPED: the cache exists so the second visit
// to the tab is instant, and the first few pages are all it takes for
// that. a busy account has tens of thousands of transactions, and
// keeping every one of them would mean one record that grows without
// bound and is rewritten whole on every page. the cap keeps the
// record a size that costs nothing to write.
//
// --- WHY --- THE NEWEST ROWS ARE THE ONES KEPT: they are the ones a
// reader sees first, and the ones that change.
const HUGGIES_ACCOUNT_TX_CACHE_MAX_ROWS = 500;
// how long a cached history is trusted as the whole answer.
//
// --- WHY ONE MINUTE: the cache is a HEAD start, not the answer. the
// api is asked for the newest rows every time, so the list is current
// within seconds; what the cache buys is the rows BELOW the first
// page, and those change rarely. a minute is long enough that a reader
// flipping between the tabs does not refetch, and short enough that
// the cached history is never the only thing the reader sees.
const HUGGIES_ACCOUNT_TX_CACHE_TTL_MS = 60_000;
// ========================================
// ========================================
// --- TYPES ------------------------------
// one page of the history, plus what the cache knows about it.
export interface HUGGIES_ACCOUNT_TX_PAGE {
  // the rows, newest first.
  rows: ReadonlyArray<HUGGIES_CACHED_ACCOUNT_TX_ROW>;
  // the api's cursor for the NEXT page, or null when the history ends
  // here.
  resume_token: string | null;
  // how many transactions the api says the account has in total.
  txs_count: number;
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// how old a cached history is, in ms. null when there is no cache.
function cache_age_ms_fun(
  entry: { fetched_at: number } | null,
): number | null {
  if (entry === null) return null;
  return Date.now() - entry.fetched_at;
}
// ========================================
// ========================================
// --- CACHED PAGE ----------------------
// the cached rows of an account, as a page.
//
// --- WHY THE RESUME TOKEN IS ONLY TRUSTED WHEN THE CACHE IS FRESH:
// the token points at a position in a history that has moved on since
// it was handed out. sending a stale token can skip rows, so a stale
// cache gives its rows and no token, and the api is asked for the
// first page afresh.
function cached_page_fun(
  entry: {
    rows: ReadonlyArray<HUGGIES_CACHED_ACCOUNT_TX_ROW>;
    resume_token: string | null;
    txs_count: number;
    fetched_at: number;
  } | null,
  account_id: string,
): HUGGIES_ACCOUNT_TX_PAGE | null {
  if (entry === null) return null;
  const age = cache_age_ms_fun(entry);
  const is_fresh = age !== null && age < HUGGIES_ACCOUNT_TX_CACHE_TTL_MS;
  return {
    rows: entry.rows,
    resume_token: is_fresh ? entry.resume_token : null,
    // the count the cache holds, or the one this session already knows.
    txs_count: entry.txs_count > 0
      ? entry.txs_count
      : (txs_counts.get(account_id) ?? 0),
  };
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// one page of an account's history.
//
// the api is asked for the newest rows. the cached rows are the rows
// below them, and the two are merged into one list.
//
// --- WHY THE MERGE IS BY HASH: a transaction can appear in both —
// the api's first page and the cached page can overlap — and the hash
// is the one thing that says whether two rows are the same
// transaction.
function merge_rows_fun(
  fresh: ReadonlyArray<HUGGIES_CACHED_ACCOUNT_TX_ROW>,
  cached: ReadonlyArray<HUGGIES_CACHED_ACCOUNT_TX_ROW>,
): ReadonlyArray<HUGGIES_CACHED_ACCOUNT_TX_ROW> {
  const seen = new Set<string>();
  const out: Array<HUGGIES_CACHED_ACCOUNT_TX_ROW> = [];
  for (const row of [...fresh, ...cached]) {
    if (seen.has(row.transaction_hash)) continue;
    seen.add(row.transaction_hash);
    out.push(row);
  }
  return out;
}
// ========================================
// ========================================
// --- TXS COUNT -------------------------
// how many transactions each account has in total.
//
// --- WHY --- THE COUNT COMES FROM THE FIRST PAGE ONLY: the api sends
// `txs_count` with the FIRST page of a history and omits it from every
// page after it. a later page that carried no count must not wipe the
// count the first page gave, so the count is remembered PER ACCOUNT —
// the page belongs to one account, and the reader may look at another.
//
// --- WHY --- IT IS A MAP AND NOT A SINGLE NUMBER: the page shows one
// account at a time, but the cache holds the histories of many, and a
// single number would carry one account's count into another's.
const txs_counts: Map<string, number> = new Map();
// ========================================
// ========================================
// --- PAGE ------------------------------
async function load_account_tx_page_fun(
  account_id: string,
  resume_token: string | null,
): Promise<HUGGIES_ACCOUNT_TX_PAGE> {
  const response = await api_account({
    account_id,
    limit: HUGGIES_ACCOUNT_TX_PAGE_SIZE,
    desc: true,
    ...(resume_token === null ? {} : { resume_token }),
    quiet: true,
  });
  const rows: Array<HUGGIES_CACHED_ACCOUNT_TX_ROW> =
    response.account_txs.map((row) => ({
      account_id: row.account_id,
      transaction_hash: row.transaction_hash,
      tx_block_height: row.tx_block_height,
      tx_block_timestamp: row.tx_block_timestamp,
      tx_index: row.tx_index,
      is_success: row.is_success,
      is_signer: row.is_signer,
      is_receiver: row.is_receiver,
      is_real_signer: row.is_real_signer,
      is_real_receiver: row.is_real_receiver,
      is_predecessor: row.is_predecessor,
      is_function_call: row.is_function_call,
      is_any_signer: row.is_any_signer,
      is_delegated_signer: row.is_delegated_signer,
      is_event_log: row.is_event_log,
      is_action_arg: row.is_action_arg,
      is_explicit_refund_to: row.is_explicit_refund_to,
    }));
  const next_token =
    response.resume_token === undefined ? null : response.resume_token;
  // the count is remembered, and a later page that carries no count
  // keeps the one the first page gave.
  //
  // --- WHY --- THE COUNT IS CHECKED AT RUNTIME: the api sends
  // `txs_count` with the FIRST page of a history and omits it from
  // every page after it, but the client's type says the field is
  // always there. so the check is invisible to the type checker and
  // only the api knows the truth.
  if (response.txs_count !== undefined) {
    txs_counts.set(account_id, response.txs_count);
  }
  return {
    rows,
    resume_token: next_token,
    txs_count: txs_counts.get(account_id) ?? 0,
  };
}
// ========================================
// ========================================
// --- CAP -------------------------------
// the newest rows of a history, no more than the cap.
//
// --- WHY --- THE CACHE KEEPS A BOUNDED NUMBER OF ROWS: the history of
// a busy account is tens of thousands of transactions, and one record
// holding all of them would be rewritten whole on every page. the
// cache is a HEAD start for the second visit, and the first few pages
// are all it needs to be one.
function cap_rows_fun(
  rows: ReadonlyArray<HUGGIES_CACHED_ACCOUNT_TX_ROW>,
): ReadonlyArray<HUGGIES_CACHED_ACCOUNT_TX_ROW> {
  if (rows.length <= HUGGIES_ACCOUNT_TX_CACHE_MAX_ROWS) return rows;
  // the rows are newest first, so the ones to keep are at the front.
  return rows.slice(0, HUGGIES_ACCOUNT_TX_CACHE_MAX_ROWS);
}
// ========================================
// ========================================
// --- LOAD WITH CACHE ------------------
// the account's history, with the cache in front of it.
//
// the cached rows are returned FIRST, so the table has something to
// show while the api is still answering. the api's rows are then put
// on top and the merged list is returned.
//
// --- WHY THE CACHED ROWS ARE NOT SIMPLY SKIPPED: the api's first page
// covers the newest rows. a reader who scrolled further down the
// history on an earlier visit saw rows the first page does not carry,
// and those rows are still in the cache.
export async function load_account_transactions_fun(
  account_id: string,
): Promise<HUGGIES_ACCOUNT_TX_PAGE> {
  const cached = await HUGGIES_ACCOUNT_TX_CACHE.get(account_id);
  const fresh = await load_account_tx_page_fun(account_id, null);
  const cached_rows = cached === null ? [] : cached.rows;
  const rows = merge_rows_fun(fresh.rows, cached_rows);
  // the cache keeps the rows it has plus the new ones, so the next
  // visit starts from further down the history.
  //
  // --- WHY --- THE FRESH ROWS COME FIRST HERE TOO: the cache keeps the
  // NEWEST rows, and the newest rows are the fresh ones. a merge that
  // put the cached rows first would fill the cache with the oldest rows
  // and drop the new ones — and the new ones are the ones that changed.
  const merged_rows = merge_rows_fun(fresh.rows, cached_rows);
  // --- WHY --- THE DEEPER CURSOR IS KEPT: the first page's cursor
  // points at the SECOND page, and the cached rows already run deeper
  // than that. writing the first page's cursor back would send the
  // reader's next scroll back to the top of the history, and every
  // page between here and there would be fetched again.
  //
  // --- WHY --- THE CURSOR IS ONLY TRUSTED WHEN THE CACHE IS FRESH: a
  // cursor points at a position in a history that has moved on, so a
  // stale one can skip rows.
  const cache_age =
    cached === null ? null : Date.now() - cached.fetched_at;
  const cached_cursor_is_fresh =
    cache_age !== null && cache_age < HUGGIES_ACCOUNT_TX_CACHE_TTL_MS;
  const resume_token =
    cached_cursor_is_fresh && cached !== null && cached.resume_token !== null
      ? cached.resume_token
      : fresh.resume_token;
  await HUGGIES_ACCOUNT_TX_CACHE.put({
    id: account_id,
    rows: cap_rows_fun(merged_rows),
    resume_token,
    txs_count: fresh.txs_count,
    fetched_at: Date.now(),
  });
  return {
    rows,
    resume_token,
    txs_count: fresh.txs_count,
  };
}
// ========================================
// ========================================
// --- CACHED PAGES ---------------------
// the cached rows of an account, without touching the api. this is what
// the page shows while the api is still answering.
//
// it resolves null when there is nothing cached, so the caller knows
// there is nothing to show yet.
export async function load_cached_account_transactions_fun(
  account_id: string,
): Promise<HUGGIES_ACCOUNT_TX_PAGE | null> {
  const entry = await HUGGIES_ACCOUNT_TX_CACHE.get(account_id);
  return cached_page_fun(entry, account_id);
}
// ========================================
// ========================================
// --- LOAD MORE ------------------------
// the NEXT page of the history, below what is already on screen.
//
// the api's cursor is the only thing that knows where the next page
// starts, so it is passed back untouched.
export async function load_more_account_transactions_fun(
  account_id: string,
  resume_token: string,
): Promise<HUGGIES_ACCOUNT_TX_PAGE> {
  const page = await load_account_tx_page_fun(account_id, resume_token);
  const cached = await HUGGIES_ACCOUNT_TX_CACHE.get(account_id);
  const cached_rows = cached === null ? [] : cached.rows;
  await HUGGIES_ACCOUNT_TX_CACHE.put({
    id: account_id,
    rows: cap_rows_fun(merge_rows_fun(cached_rows, page.rows)),
    resume_token: page.resume_token,
    txs_count: page.txs_count,
    fetched_at: Date.now(),
  });
  return page;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
