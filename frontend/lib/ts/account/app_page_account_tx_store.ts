// ========================================
// the account page's transaction state: the rows on screen, the cursor
// for the next page, and the errors.
//
// one store, because the page's transactions are read by the tab bar
// (to know whether there is anything to show) and by the transactions
// table. the loader writes here and the components subscribe, so no
// component fetches anything itself.
//
// --- WHY IT IS ITS OWN STORE AND NOT A FIELD OF THE ACCOUNT STORE:
// the transactions are only fetched when the reader is on the
// transactions tab, so they have a life of their own. the account
// store holds the balances, which are fetched on every visit.
//
// --- WHY THE STORE WATCHES THE TAB: the transactions are fetched when
// the reader switches to the transactions tab, so the store asks the
// tab state for the current tab and loads when it is the
// transactions one.
import {
  load_account_transactions_fun,
  load_cached_account_transactions_fun,
  load_more_account_transactions_fun,
} from "./app_page_account_transactions";
import { HUGGIES_APP_PAGE_ACCOUNT_ID } from "./app_page_account_id";
import { HUGGIES_APP_PAGE_ACCOUNT_TAB_STATE } from "./app_page_account_tab_state";
import type { HUGGIES_ACCOUNT_TX_PAGE } from "./app_page_account_transactions";
import type { HUGGIES_CACHED_ACCOUNT_TX_ROW } from "./app_page_account_transactions_cache";
// ========================================
// ========================================
// --- TYPES ------------------------------
// what the store holds.
export interface HUGGIES_APP_PAGE_ACCOUNT_TX_STATE {
  // the rows on screen, newest first.
  rows: ReadonlyArray<HUGGIES_CACHED_ACCOUNT_TX_ROW>;
  // the api's cursor for the next page, or null when the history ends
  // here.
  resume_token: string | null;
  // how many transactions the account has in total.
  txs_count: number;
  // true while the first page is loading.
  loading: boolean;
  // true while the next page is loading.
  loading_more: boolean;
  // the error, or null when nothing failed.
  error: string | null;
}
// ========================================
// ========================================
// --- STATE ------------------------------
// the empty state the page holds before the first load answers.
const HUGGIES_EMPTY_STATE: HUGGIES_APP_PAGE_ACCOUNT_TX_STATE = {
  rows: [],
  resume_token: null,
  txs_count: 0,
  loading: false,
  loading_more: false,
  error: null,
};
let state: HUGGIES_APP_PAGE_ACCOUNT_TX_STATE = HUGGIES_EMPTY_STATE;
// the account id the current load was for, so a new account id starts a
// new load and clears the old rows.
let loaded_account_id: string | null = null;
// the account id the last FETCH was for, and the page it brought back.
//
// --- WHY --- the prefetch and the load ask for the same thing. when
// the reader switches to the transactions tab after the prefetch has
// already answered, the answer is used and no second request is made.
// without this the tab switch would fetch the page the prefetch had
// just fetched, which is a request for nothing.
let fetched_account_id: string | null = null;
let fetched_page: HUGGIES_ACCOUNT_TX_PAGE | null = null;
// the fetch that is running right now, or null.
//
// --- WHY --- the prefetch and the load both go to the api, and they
// can be asked for at the same time — the reader switches to the
// transactions tab while the background prefetch is still on its way.
// one shared promise means the second caller waits for the first
// answer instead of making a second request.
let in_flight: Promise<HUGGIES_ACCOUNT_TX_PAGE> | null = null;
// the plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// ========================================
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing cannot break the notify.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[app_page_account_tx_store] listener failed", err);
    }
  }
}
// ========================================
// register a re-render callback; returns an unsubscribe to clean up on unmount.
function subscribe_fun(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}
// ========================================
// ========================================
// --- WRITE ------------------------------
function set_state_fun(next: HUGGIES_APP_PAGE_ACCOUNT_TX_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// ========================================
// --- FETCH ---------------------------
// the one fetch the store makes, shared by the load and the prefetch.
//
// --- WHY --- the two callers want the same thing — the account's
// newest page of history, merged with what the cache holds — and
// making it twice would mean two requests for one answer. one
// promise is kept while it is on its way, and the second caller waits
// for it.
function fetch_fun(account_id: string): Promise<HUGGIES_ACCOUNT_TX_PAGE> {
  if (in_flight !== null) return in_flight;
  const promise = load_account_transactions_fun(account_id)
    .then((page) => {
      fetched_account_id = account_id;
      fetched_page = page;
      return page;
    })
    .finally(() => {
      if (in_flight === promise) in_flight = null;
    });
  in_flight = promise;
  return promise;
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// load the account's transactions.
//
// the load runs once per account id. a second call for the same id
// while a load is running is ignored, so the page cannot fetch twice
// because two components asked for it.
//
// --- WHY THE CACHED ROWS ARE SHOWN FIRST: the cached history is
// already on the reader's machine, so the table has rows on screen
// while the api is still answering. the api's rows land on top of them.
async function load_fun(): Promise<void> {
  const account_id = HUGGIES_APP_PAGE_ACCOUNT_ID.get_account_id();
  if (account_id === null) return;
  // --- WHY --- the load only runs on the transactions tab: the
  // balances tab is the view most readers want, and a reader who
  // never opens the transactions tab should never pay for the
  // history. the tab is watched, so opening the tab starts the load.
  if (HUGGIES_APP_PAGE_ACCOUNT_TAB_STATE.get_tab() !== "transactions") {
    return;
  }
  if (state.loading && loaded_account_id === account_id) return;
  // --- WHY --- THE ROWS THAT ARE ALREADY ON SCREEN ARE KEPT: the
  // reader switching back to the transactions tab does not need the
  // history again — the rows are still there, and the account has not
  // changed. reloading them would clear the table and fetch a page the
  // reader already has.
  //
  // --- WHY --- A NEW ACCOUNT ID DOES RELOAD: the rows on screen belong
  // to the old account, and showing them under the new account's name
  // would be a lie.
  const account_changed = loaded_account_id !== account_id;
  loaded_account_id = account_id;
  // the rows are already on screen for this account and nothing is
  // loading. there is nothing to do.
  if (!account_changed && state.rows.length > 0 && !state.loading) return;
  set_state_fun({
    ...HUGGIES_EMPTY_STATE,
    loading: true,
    // the rows stay on screen while the new page is on its way, unless
    // they belong to another account.
    rows: account_changed ? [] : state.rows,
    resume_token: account_changed ? null : state.resume_token,
    txs_count: account_changed ? 0 : state.txs_count,
  });
  try {
    // the cached rows first, so there is something to show.
    const cached = await load_cached_account_transactions_fun(account_id);
    if (loaded_account_id !== account_id) return;
    if (cached !== null) {
      set_state_fun({
        ...state,
        rows: cached.rows,
        resume_token: cached.resume_token,
        txs_count: cached.txs_count,
        loading: true,
      });
    }
    // the api's answer, or the one the prefetch already brought back.
    //
    // --- WHY --- the prefetch's answer is used: the reader switched to
    // the transactions tab and the background prefetch had already
    // fetched that very page. fetching it again would be a request
    // for an answer the store is already holding.
    const page =
      fetched_account_id === account_id && fetched_page !== null
        ? fetched_page
        : await fetch_fun(account_id);
    if (loaded_account_id !== account_id) return;
    set_state_fun({
      rows: page.rows,
      resume_token: page.resume_token,
      txs_count: page.txs_count,
      loading: false,
      loading_more: false,
      error: null,
    });
  } catch (err) {
    if (loaded_account_id !== account_id) return;
    set_state_fun({
      ...state,
      loading: false,
      loading_more: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
// ========================================
// ========================================
// --- LOAD MORE ------------------------
// load the NEXT page of the history and append it to the rows on screen.
//
// the page is appended rather than replacing, so the reader keeps what
// they scrolled to. a load that fails leaves the rows on screen alone
// and records the error.
async function load_more_fun(): Promise<void> {
  const account_id = HUGGIES_APP_PAGE_ACCOUNT_ID.get_account_id();
  if (account_id === null) return;
  if (state.loading || state.loading_more) return;
  if (state.resume_token === null) return;
  const token = state.resume_token;
  set_state_fun({ ...state, loading_more: true });
  try {
    const page = await load_more_account_transactions_fun(account_id, token);
    if (loaded_account_id !== account_id) return;
    const seen = new Set(state.rows.map((row) => row.transaction_hash));
    const appended = page.rows.filter((row) => !seen.has(row.transaction_hash));
    set_state_fun({
      ...state,
      rows: [...state.rows, ...appended],
      resume_token: page.resume_token,
      txs_count: page.txs_count,
      loading_more: false,
      error: null,
    });
  } catch (err) {
    if (loaded_account_id !== account_id) return;
    set_state_fun({
      ...state,
      loading_more: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
// ========================================
// ========================================
// --- READ ------------------------------
function get_state_fun(): HUGGIES_APP_PAGE_ACCOUNT_TX_STATE {
  return state;
}
// ========================================
// ========================================
// --- PREFETCH --------------------------
// warm the cache for the account, without touching what is on screen.
//
// --- WHY --- a reader who opens the account page most likely wants to
// read it and then look at the transactions. fetching the history in
// the background means the switch to the transactions tab is instant.
// the rows are NOT put on screen — the tab decides what the page
// shows — so this costs one request and nothing else.
//
// --- WHY --- it is not the same as the load: the load puts the rows on
// screen and follows the tab, and this only fills the cache.
//
// --- WHY --- IT IS NOT DONE ON EVERY ACCOUNT PAGE: the reader may
// never open the transactions tab, and then the request was wasted.
// it is done only when the tab is the balances one and the account
// has no cached history yet.
async function prefetch_fun(): Promise<void> {
  const account_id = HUGGIES_APP_PAGE_ACCOUNT_ID.get_account_id();
  if (account_id === null) return;
  // the transactions tab is showing — the load is already running.
  if (HUGGIES_APP_PAGE_ACCOUNT_TAB_STATE.get_tab() === "transactions") {
    return;
  }
  // the cache is already warm — there is nothing to fetch.
  const cached = await load_cached_account_transactions_fun(account_id);
  if (cached !== null) return;
  try {
    // --- WHY --- the shared fetch: the reader can switch to the
    // transactions tab while this prefetch is on its way, and the load
    // that follows must wait for this answer rather than make a
    // second request.
    await fetch_fun(account_id);
  } catch (err) {
    // a failed prefetch is not an error the reader has to see: the
    // tab that needs the history will fetch it again and show the
    // failure there.
    console.warn("[app_page_account_tx_store] prefetch failed", err);
  }
}
// ========================================
// ========================================
// --- WATCH -----------------------------
// the store follows the page's account id and the page's tab.
//
// --- WHY THE TAB IS WATCHED: the transactions are fetched when the
// reader is on the transactions tab. a reader who lands on the
// balances tab never asks for the history at all, and one who
// switches to the transactions tab gets it fetched by itself.
//
// --- WHY THE LOAD RUNS ONCE RIGHT AWAY: the subscription only fires
// on a CHANGE, and a reader who lands on the transactions tab has not
// changed anything — the tab was already the transactions one when
// the page loaded. without this the history would never be fetched
// for that reader, and the tab would sit empty.
function watch_fun(): void {
  HUGGIES_APP_PAGE_ACCOUNT_ID.subscribe(() => {
    void load_fun();
  });
  HUGGIES_APP_PAGE_ACCOUNT_TAB_STATE.subscribe(() => {
    void load_fun();
  });
  // the page's first load.
  void load_fun();
  // the history is warmed in the background, so the switch to the
  // transactions tab is instant.
  void prefetch_fun();
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_ACCOUNT_TX_STORE = {
  get: get_state_fun,
  subscribe: subscribe_fun,
  load: load_fun,
  load_more: load_more_fun,
  watch: watch_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
