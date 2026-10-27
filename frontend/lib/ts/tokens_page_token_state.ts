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
// public surface, in one place so components have a single import.
export const HUGGIES_TOKENS_PAGE_TOKEN_STATE = {
  get: get_state_fun,
  set: set_state_fun,
  subscribe: subscribe_fun,
  reset: reset_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
