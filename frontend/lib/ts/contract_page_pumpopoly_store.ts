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
// ========================================
import { load_pumpopoly_page_fun } from "./contract_page_pumpopoly";
import type { HUGGIES_PUMPOPOLY_DATA } from "./contract_page_pumpopoly_parse";
// ========================================
// ========================================
// --- STATE ------------------------------
// null until the load finishes. components render nothing until then.
let data: HUGGIES_PUMPOPOLY_DATA | null = null;
// the account id the current load was for, so a new account id starts a
// new load and clears the old data.
let loaded_account_id: string | null = null;
// true while a load is running.
let loading = false;
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
async function contract_page_pumpopoly_store_load_fun(
  account_id: string,
): Promise<void> {
  if (loading && loaded_account_id === account_id) return;
  loading = true;
  loaded_account_id = account_id;
  data = null;
  notify_fun();
  try {
    const result = await load_pumpopoly_page_fun(account_id);
    // a load for an older account id must not overwrite a newer one.
    if (loaded_account_id !== account_id) return;
    data = result;
  } catch (err) {
    if (loaded_account_id !== account_id) return;
    data = {
      player: null,
      nft: { count: 0, token_ids: [] },
      credit_score: 0,
      errors: [err instanceof Error ? err.message : String(err)],
    };
  } finally {
    if (loaded_account_id === account_id) {
      loading = false;
      notify_fun();
    }
  }
}
// ========================================
// ========================================
// --- READ ------------------------------
// the loaded data, or null while it is still loading.
function get_data_fun(): HUGGIES_PUMPOPOLY_DATA | null {
  return data;
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
  get_data: get_data_fun,
  is_loading: is_loading_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
