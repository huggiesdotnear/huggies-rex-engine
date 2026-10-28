// ========================================
// the Pumpopoly page's shared state: the one load, held here, read by
// every component on the page.
//
// the components on this page do not fetch. they read this store. that
// is what makes the page's request list knowable — there is exactly one
// loader (lib/ts/contract_page_pumpopoly.ts), so there is exactly one
// set of requests.
//
// the store has the same shape as lib/ts/app_page_account_store.ts:
// plain module state, a subscribe/unsubscribe pair, and a notify that a
// throwing subscriber cannot break.
//
// --- WHY --- the store subscribes to the page's account id: the id can
// change under the page — the reader signs in, signs out, or the id in
// the url changes. the store loads the new id by itself, so no
// component has to watch for it and no component has to call load().
import { load_pumpopoly_page_fun } from "./contract_page_pumpopoly";
import { HUGGIES_PAGE_ACCOUNT_ID } from "./page_account_id";
import type { HUGGIES_PUMPOPOLY_DATA } from "./contract_page_pumpopoly_parse";
// ========================================
// ========================================
// --- STATE ------------------------------
// null until the load finishes. components render nothing until then.
let data: HUGGIES_PUMPOPOLY_DATA | null = null;
// the account id the page is about, and the one the current load was
// for.
//
// --- WHY --- the id lives here as well as in the id module: the
// components need it to build their links and to know whether there is
// a player at all, and the store is what they already read. when the
// id changes, the store re-loads and this is updated with it, so the
// components follow.
let account_id: string | null = null;
// the account id the current load was for, so a new account id starts a
// new load and clears the old data.
let loaded_account_id: string | null = null;
// true while a load is running.
let loading = false;
// true once the page's id is being watched, so watch() is set up once.
let watching = false;
// the plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// ========================================
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing cannot break the
// flow that notified.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[contract_page_pumpopoly_store] listener failed", err);
    }
  }
}
// ========================================
// register a re-render callback; returns an unsubscribe so components
// can clean up on unmount instead of leaking.
function subscribe_fun(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// load the page's data for one account.
//
// the load runs once per account id. a second call for the same id
// while a load is running is ignored, so the page cannot fetch twice
// because two components asked for it.
// --- WHY --- the components used to each trigger their own fetch, so
// "the page loaded" was really "several loads happened, at several
// different times". one loader, one load, one request list.
//
// --- WHY --- the load takes no argument: the store reads the page's
// account id itself and watches it, so the page loads whatever the id
// says at that moment and re-loads when the id changes.
async function contract_page_pumpopoly_store_load_fun(): Promise<void> {
  const next_account_id = HUGGIES_PAGE_ACCOUNT_ID.get_account_id();
  // --- WHY --- the id is stored even when there is no player: the
  // components read it to know there is nothing to show, and they read
  // it through the store so they follow it when it changes.
  if (account_id !== next_account_id) {
    account_id = next_account_id;
    notify_fun();
  }
  if (next_account_id === null) return;
  const load_account_id = next_account_id;
  if (loading && loaded_account_id === load_account_id) return;
  loading = true;
  loaded_account_id = load_account_id;
  data = null;
  notify_fun();
  try {
    const result = await load_pumpopoly_page_fun(load_account_id);
    // a load for an older account id must not overwrite a newer one.
    if (loaded_account_id !== load_account_id) return;
    data = result;
  } catch (err) {
    if (loaded_account_id !== load_account_id) return;
    data = {
      player: null,
      nft: { count: 0, token_ids: [] },
      credit_score: 0,
      errors: {
        player: err instanceof Error ? err.message : String(err),
        nfts: null,
      },
    };
  } finally {
    if (loaded_account_id === load_account_id) {
      loading = false;
      notify_fun();
    }
  }
}
// ========================================
// ========================================
// --- WATCH -----------------------------
// watch the page's account id and re-load when it changes.
//
// --- WHY --- the id can change under the page: the reader signs in,
// signs out, or the id in the url changes. the store re-loads by
// itself, so no component has to watch for it.
function contract_page_pumpopoly_store_watch_fun(): void {
  // --- WHY --- the subscription is set up once: a second watch() would
  // add a second listener, and the id would then load twice for every
  // change.
  if (watching) return;
  watching = true;
  const unsubscribe = HUGGIES_PAGE_ACCOUNT_ID.subscribe(() => {
    // --- WHY --- the public load and not the internal one: the public
    // one is what the page and the tests go through, so it is the one
    // that must be called.
    void HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE.load();
  });
  // the subscription lives as long as the page does, so it is never
  // unsubscribed. the module is loaded once per document.
  void unsubscribe;
}
// ========================================
// --- READ ------------------------------
// the loaded data, or null while it is still loading.
function get_fun(): HUGGIES_PUMPOPOLY_DATA | null {
  return data;
}
// ========================================
// the account id the page is about, or null when there is none.
//
// --- WHY --- it is read through the store so the components have one
// place to read from: the id and the data always change together, and
// the store is what tells the components to re-render.
function get_account_id_fun(): string | null {
  return account_id;
}
// ========================================
// true while a load is running.
function is_loading_fun(): boolean {
  return loading;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE = {
  load: contract_page_pumpopoly_store_load_fun,
  subscribe: subscribe_fun,
  get: get_fun,
  get_account_id: get_account_id_fun,
  is_loading: is_loading_fun,
  watch: contract_page_pumpopoly_store_watch_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
