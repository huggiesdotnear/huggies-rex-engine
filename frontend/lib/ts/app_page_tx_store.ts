// ========================================
// the transaction page's shared state: the loaded transaction, and the
// error.
//
// one store, because the page is split into several components — the
// summary, the actions, the transfers, the receipts — and they all
// read the same load. the loader writes here and the components
// subscribe, so no component fetches anything itself.
//
// --- WHY IT IS ITS OWN STORE: the page shows ONE thing, so the store
// holds one thing. the account page's store holds four balance tables
// and the transaction page's holds one transaction.
import { HUGGIES_APP_PAGE_TX } from "./app_page_tx";
import { HUGGIES_URL_TX } from "./app_page_tx_url";
import type { HUGGIES_APP_PAGE_TX_DATA } from "./app_page_tx";
// ========================================
// ========================================
// --- TYPES ------------------------------
// what the store holds.
export interface HUGGIES_APP_PAGE_TX_STATE {
  // the loaded transaction, or null while it is loading.
  data: HUGGIES_APP_PAGE_TX_DATA | null;
  // true while a load is running.
  loading: boolean;
  // the error, or null when nothing failed.
  error: string | null;
}
// ========================================
// ========================================
// --- STATE ------------------------------
// the empty state the page holds before the first load answers.
const HUGGIES_EMPTY_STATE: HUGGIES_APP_PAGE_TX_STATE = {
  data: null,
  loading: false,
  error: null,
};
let state: HUGGIES_APP_PAGE_TX_STATE = HUGGIES_EMPTY_STATE;
// the hash the current load was for, so a second load for the same
// hash does not start over.
let loaded_tx_hash: string | null = null;
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
      console.error("[app_page_tx_store] listener failed", err);
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
function set_state_fun(next: HUGGIES_APP_PAGE_TX_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// load the transaction the url names.
//
// the load runs once per hash. a second call for the same hash while a
// load is running is ignored, so the page cannot fetch twice because
// two components asked for it.
//
// --- WHY A MISSING HASH IS AN ERROR AND NOT AN EMPTY PAGE: a url
// with no `?tx=` is a broken link, and saying so is more useful than
// showing an empty page.
async function load_fun(): Promise<void> {
  const tx_hash = HUGGIES_URL_TX.read();
  if (tx_hash === null) {
    set_state_fun({
      data: null,
      loading: false,
      error: "NO TRANSACTION IN THE URL",
    });
    return;
  }
  if (state.loading && loaded_tx_hash === tx_hash) return;
  loaded_tx_hash = tx_hash;
  set_state_fun({ data: null, loading: true, error: null });
  try {
    const data = await HUGGIES_APP_PAGE_TX.load(tx_hash);
    // a load for an older hash must not overwrite a newer one.
    if (loaded_tx_hash !== tx_hash) return;
    if (data === null) {
      set_state_fun({
        data: null,
        loading: false,
        error: "TRANSACTION NOT FOUND",
      });
      return;
    }
    set_state_fun({ data, loading: false, error: null });
  } catch (err) {
    if (loaded_tx_hash !== tx_hash) return;
    set_state_fun({
      data: null,
      loading: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
// ========================================
// ========================================
// --- READ ------------------------------
function get_state_fun(): HUGGIES_APP_PAGE_TX_STATE {
  return state;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_TX_STORE = {
  get: get_state_fun,
  subscribe: subscribe_fun,
  load: load_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
