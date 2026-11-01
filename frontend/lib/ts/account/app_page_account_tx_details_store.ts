// ========================================
// the account page's transaction details state: the full detail of the
// account's newest transactions.
//
// one store, because the cards section reads it and the table's store
// tells it WHICH transactions to fetch. the loader writes here and the
// cards subscribe, so no component fetches anything itself.
//
// --- WHY IT IS ITS OWN STORE AND NOT A FIELD OF THE TABLE'S STORE:
// the details are a different thing from the rows. the rows are the
// account's history — a list of hashes — and the details are the full
// transaction of a handful of them. one asks the history endpoint and
// the other asks the details endpoint.
import { api_account } from "@sleet-js/fastnear-explorer-api-client";
import { load_tx_details_fun } from "./app_page_account_tx_details";
import { HUGGIES_APP_PAGE_ACCOUNT_ID } from "./app_page_account_id";
import { HUGGIES_APP_PAGE_ACCOUNT_TAB_STATE } from "./app_page_account_tab_state";
import { HUGGIES_APP_PAGE_ACCOUNT_TX_STORE } from "./app_page_account_tx_store";
import type { HUGGIES_APP_PAGE_ACCOUNT_TX_DETAIL } from "./app_page_account_tx_details";
import type { HUGGIES_CACHED_ACCOUNT_TX_ROW } from "./app_page_account_transactions_cache";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how long the table's rows are waited for before the newest few are
// asked for on their own.
//
// --- WHY --- IT IS SHORT: the table is fetching the same rows at the
// same time, so it lands in about a second. the wait is there so the
// page makes ONE request for the history and not two.
const HUGGIES_TABLE_ROWS_WAIT_MS = 1500;
// ========================================
// ========================================
// --- TYPES ------------------------------
// what the store holds.
export interface HUGGIES_APP_PAGE_ACCOUNT_TX_DETAIL_STATE {
  // the full transactions, newest first.
  details: ReadonlyArray<HUGGIES_APP_PAGE_ACCOUNT_TX_DETAIL>;
  // true while the details are loading.
  loading: boolean;
  // the error, or null when nothing failed.
  error: string | null;
}
// ========================================
// ========================================
// --- STATE ------------------------------
// the empty state the page holds before the first load answers.
const HUGGIES_EMPTY_STATE: HUGGIES_APP_PAGE_ACCOUNT_TX_DETAIL_STATE = {
  details: [],
  loading: false,
  error: null,
};
let state: HUGGIES_APP_PAGE_ACCOUNT_TX_DETAIL_STATE = HUGGIES_EMPTY_STATE;
// the account id the current load was for, so a new account id starts a
// new load and clears the old details.
let loaded_account_id: string | null = null;
// true while a load is running.
let loading = false;
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
      console.error("[app_page_account_tx_details_store] listener failed", err);
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
function set_state_fun(next: HUGGIES_APP_PAGE_ACCOUNT_TX_DETAIL_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// load the details of the account's newest transactions.
//
// --- WHY --- THE HASHES COME FROM THE HISTORY STORE: the history
// endpoint says which transactions the account has and when, and the
// details endpoint says what they were. the history is the list of
// what to fetch and the details are the answer.
//
// --- WHY --- THE LOAD ONLY RUNS ON THE TRANSACTIONS TAB: the cards
// belong to that tab, and a reader who never opens it should not pay
// for the details.
async function load_fun(): Promise<void> {
  const account_id = HUGGIES_APP_PAGE_ACCOUNT_ID.get_account_id();
  if (account_id === null) return;
  if (HUGGIES_APP_PAGE_ACCOUNT_TAB_STATE.get_tab() !== "transactions") {
    return;
  }
  if (loading && loaded_account_id === account_id) return;
  loaded_account_id = account_id;
  set_state_fun({ ...HUGGIES_EMPTY_STATE, loading: true });
  try {
    const hashes = await newest_hashes_fun(account_id);
    if (loaded_account_id !== account_id) return;
    if (hashes.length === 0) {
      set_state_fun({ details: [], loading: false, error: null });
      return;
    }
    const details = await load_tx_details_fun(hashes);
    if (loaded_account_id !== account_id) return;
    set_state_fun({ details, loading: false, error: null });
  } catch (err) {
    if (loaded_account_id !== account_id) return;
    set_state_fun({
      details: [],
      loading: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
// ========================================
// ========================================
// --- WAIT FOR THE TABLE'S ROWS ----------
// the table's rows, once they have landed.
//
// --- WHY --- THE TABLE IS WATCHED AND NOT POLLED: the table's store
// announces when it changes, so this waits for that announcement
// instead of asking the database every few milliseconds.
//
// --- WHY --- IT GIVES UP AFTER A MOMENT: the table might be on a
// different account, or it might have failed. the fallback then asks
// for the newest few on its own.
function wait_for_table_rows_fun(): Promise<
  ReadonlyArray<HUGGIES_CACHED_ACCOUNT_TX_ROW>
> {
  return new Promise((resolve) => {
    let is_settled = false;
    const finish = (): void => {
      if (is_settled) return;
      is_settled = true;
      unsubscribe();
      clearTimeout(timer);
      resolve(HUGGIES_APP_PAGE_ACCOUNT_TX_STORE.get().rows);
    };
    const unsubscribe = HUGGIES_APP_PAGE_ACCOUNT_TX_STORE.subscribe(() => {
      // the rows have landed.
      if (HUGGIES_APP_PAGE_ACCOUNT_TX_STORE.get().rows.length > 0) {
        finish();
      }
    });
    const timer = setTimeout(finish, HUGGIES_TABLE_ROWS_WAIT_MS);
    // the rows may already be there.
    if (HUGGIES_APP_PAGE_ACCOUNT_TX_STORE.get().rows.length > 0) {
      finish();
    }
  });
}
// ========================================
// ========================================
// --- NEWEST HASHES ---------------------
// the hashes of the account's newest transactions.
//
// --- WHY --- THE TABLE'S ROWS ARE USED WHEN THEY ARE THERE: the table
// already fetched the account's newest rows, and the rows carry the
// hashes. asking the history endpoint again for the same hashes is a
// second request for an answer the page already has, and the api
// rate limits at about five requests a second.
//
// --- WHY --- THERE IS A FALLBACK ANYWAY: the two stores load at the
// same time, so the table's rows may not have landed yet. the
// fallback asks for the newest few on their own, which is one small
// request.
async function newest_hashes_fun(account_id: string): Promise<string[]> {
  const rows = HUGGIES_APP_PAGE_ACCOUNT_TX_STORE.get().rows;
  if (rows.length > 0) {
    return rows.map((row) => row.transaction_hash);
  }
  // --- WHY --- THE TABLE IS WAITED FOR FIRST: the table's store is
  // fetching the same rows this would ask for, and two requests for
  // one answer is what the api's rate limit punishes. so the table is
  // given a moment to land its rows, and only then is the fallback
  // used.
  const settled = await wait_for_table_rows_fun();
  if (settled.length > 0) {
    return settled.map((row) => row.transaction_hash);
  }
  const response = await api_account({
    account_id,
    limit: 5,
    desc: true,
  });
  return response.account_txs.map((row) => row.transaction_hash);
}
// ========================================
// ========================================
// --- READ ------------------------------
function get_state_fun(): HUGGIES_APP_PAGE_ACCOUNT_TX_DETAIL_STATE {
  return state;
}
// ========================================
// ========================================
// --- WATCH -----------------------------
// the store follows the page's account id and the page's tab.
//
// --- WHY THE LOAD RUNS ONCE RIGHT AWAY: the subscription only fires
// on a CHANGE, and a reader who lands on the transactions tab has not
// changed anything — the tab was already the transactions one when the
// page loaded. without this the cards would never be fetched for that
// reader, and the section would sit empty.
function watch_fun(): void {
  HUGGIES_APP_PAGE_ACCOUNT_ID.subscribe(() => {
    void load_fun();
  });
  HUGGIES_APP_PAGE_ACCOUNT_TAB_STATE.subscribe(() => {
    void load_fun();
  });
  void load_fun();
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_ACCOUNT_TX_DETAIL_STORE = {
  get: get_state_fun,
  subscribe: subscribe_fun,
  load: load_fun,
  watch: watch_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
