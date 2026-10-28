// ========================================
// the token page's state: the loaded token, its holders, and the error.
//
// one store, because the page is split into three components — the
// jump box, the metadata, and the holders table — and they all read
// the same load. the loader writes here and the components subscribe,
// so no component fetches anything itself.
//
// the shape is the same as lib/ts/page_account_id.ts: plain module
// state, a subscribe/unsubscribe pair, and a notify that a throwing
// subscriber cannot break.
// ========================================
import { HUGGIES_TOKENS_PAGE_TOKEN } from "./tokens_page_token";
import { HUGGIES_TOKENS_PAGE_TOKEN_ID } from "./tokens_page_token_id";
import type { HUGGIES_TOKEN_PAGE_STATE } from "./tokens_page_token_detail";
// ========================================
// --- STATE ------------------------------
// the page's state. the empty state is what the page holds before the
// first load answers.
let state: HUGGIES_TOKEN_PAGE_STATE = {
  detail: null,
  holders: [],
  holder_total: 0,
  next_cursor: null,
  loading_more: false,
  error: null,
};
// the token id the page is about.
//
// --- WHY --- it lives here as well as in the id module: the components
// need it to build their links and to know whether there is a token at
// all, and the store is what they already read.
let token_id: string | null = null;
// the token id the current load was for, so a second load for the same
// id does not start over.
let loaded_token_id: string | null = null;
// true while a load is running.
let loading = false;
// plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing (or
// unsubscribing mid-notify) cannot break the flow that notified.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[tokens_page_token_state] listener failed", err);
    }
  }
}
// ========================================
// --- WRITE ------------------------------
// replace the page's state and tell the subscribers.
function set_state_fun(next: HUGGIES_TOKEN_PAGE_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// --- READ ------------------------------
// the page's state, as it is right now.
function get_state_fun(): HUGGIES_TOKEN_PAGE_STATE {
  return state;
}
// ========================================
// --- SUBSCRIBE -------------------------
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
// --- RESET -----------------------------
// put the page back to its empty state.
//
// --- WHY --- the page reloads on a new token id (the jump box writes
// the id to the url and the browser navigates), so the store starts
// empty on every load. the reset is still here so a re-mount inside
// the same document — a bfcache restore, a test — cannot show the
// previous token's holders under the new token's name.
function reset_fun(): void {
  set_state_fun({
    detail: null,
    holders: [],
    holder_total: 0,
    next_cursor: null,
    loading_more: false,
    error: null,
  });
}
// ========================================
// --- LOAD -------------------------------
// load the page's data for one token.
//
// the load runs once per token id. a second call for the same id while
// a load is running is ignored, so the page cannot fetch twice because
// two components asked for it.
//
// --- WHY --- the metadata and the holders are asked for together: the
// holders table prices each balance with the token's price and scales
// it by the token's decimals, and both come from the metadata
// response. but the holders request does not need them — it returns
// raw balances — so there is nothing to wait for.
async function tokens_page_token_state_load_fun(): Promise<void> {
  const next_token_id = HUGGIES_TOKENS_PAGE_TOKEN_ID.get();
  // --- WHY --- the id is stored even when there is none: the
  // components read it to know there is nothing to show, and they read
  // it through the store so they follow it when it changes.
  if (token_id !== next_token_id) {
    token_id = next_token_id;
    notify_fun();
  }
  if (next_token_id === null) return;
  const load_token_id = next_token_id;
  if (loading && loaded_token_id === load_token_id) return;
  loading = true;
  loaded_token_id = load_token_id;
  reset_fun();
  notify_fun();
  try {
    const [detail, holder_page] = await Promise.all([
      HUGGIES_TOKENS_PAGE_TOKEN.load_detail(load_token_id),
      HUGGIES_TOKENS_PAGE_TOKEN.load_holders(load_token_id, null),
    ]);
    // a load for an older token id must not overwrite a newer one.
    if (loaded_token_id !== load_token_id) return;
    set_state_fun({
      detail,
      holders: holder_page.rows,
      holder_total: holder_page.total,
      next_cursor: holder_page.next_cursor,
      loading_more: false,
      error: null,
    });
  } catch (err) {
    if (loaded_token_id !== load_token_id) return;
    set_state_fun({
      detail: null,
      holders: [],
      holder_total: 0,
      next_cursor: null,
      loading_more: false,
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    if (loaded_token_id === load_token_id) {
      loading = false;
      notify_fun();
    }
  }
}
// ========================================
// the token id the page is about, or null when there is none.
//
// --- WHY --- it is read through the store so the components have one
// place to read from: the id and the data always change together, and
// the store is what tells the components to re-render.
function get_token_id_fun(): string | null {
  return token_id;
}
// ========================================
// public surface, in one place so components have a single import.
export const HUGGIES_TOKENS_PAGE_TOKEN_STATE = {
  get: get_state_fun,
  set: set_state_fun,
  subscribe: subscribe_fun,
  reset: reset_fun,
  load: tokens_page_token_state_load_fun,
  get_token_id: get_token_id_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
