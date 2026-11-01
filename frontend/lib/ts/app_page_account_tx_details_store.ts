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
import { load_tx_details_fun } from "./app_page_account_tx_details";
import { HUGGIES_APP_PAGE_ACCOUNT_ID } from "./app_page_account_id";
import { HUGGIES_APP_PAGE_ACCOUNT_TAB_STATE } from "./app_page_account_tab";
import type { HUGGIES_APP_PAGE_ACCOUNT_TX_DETAIL } from "./app_page_account_tx_details";
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
// --- NEWEST HASHES ---------------------
// the hashes of the account's newest transactions.
//
// --- WHY --- THE HISTORY IS ASKED FOR ITS OWN SAKE: the details
// endpoint takes hashes, and the history endpoint is what says which
// hashes the account has. so the newest few come from there.
//
// --- WHY --- IT IS A SEPARATE CALL AND NOT THE TABLE'S ROWS: the
// table's store holds the rows it has already fetched, and it may not
// have any yet — it only loads when the tab is opened, and this
// section loads at the same time. asking for the newest few on their
// own is one small request and it does not wait for the table.
async function newest_hashes_fun(account_id: string): Promise<string[]> {
  const { api_account } = await import("@sleet-js/fastnear-explorer-api-client");
  const response = await api_account({
    account_id,
    limit: 5,
    desc: true,
    quiet: true,
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
