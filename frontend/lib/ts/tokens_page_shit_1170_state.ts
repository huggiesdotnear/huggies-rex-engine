// ========================================
// the $SHIT page's shared state: the one load, held here, read by every
// component on the page.
//
// the components on this page do not fetch. they read this store. that
// is what makes the page's request list knowable — there is exactly one
// loader (lib/ts/tokens_page_shit_1170.ts), so there is exactly one set
// of requests.
//
// the store has the same shape as lib/ts/tokens_page_token_state.ts:
// plain module state, a subscribe/unsubscribe pair, and a notify that a
// throwing subscriber cannot break.
import type { HUGGIES_SHIT_SUMMARY } from "./tokens_page_shit_1170_summary";
import type { HUGGIES_SHIT_PRICE } from "./tokens_page_shit_1170_price";
import type { HUGGIES_SHIT_HOLDER } from "./tokens_page_shit_1170_holders";
import type { HUGGIES_SHIT_HOLDER_TYPE } from "./tokens_page_shit_1170_known_holders";
// ========================================
// ========================================
// --- TYPES -----------------------------
// the filter currently applied to the holder list.
export type HUGGIES_SHIT_ACTIVE_FILTER = HUGGIES_SHIT_HOLDER_TYPE | "all";
// ========================================
// the page's state. the empty state is what the page holds before the
// first load answers.
export interface HUGGIES_SHIT_1170_STATE {
  // the token's summary, once it has loaded.
  summary: HUGGIES_SHIT_SUMMARY | null;
  // the price, once it has loaded.
  price: HUGGIES_SHIT_PRICE | null;
  // the holder rows loaded so far.
  holders: HUGGIES_SHIT_HOLDER[];
  // how many holders the api says there are in total.
  holder_total: number;
  // the cursor for the next holder page, or null when there is none.
  next_cursor: string | null;
  // true while a further holder page is loading.
  loading_more: boolean;
  // the filter the reader picked.
  active_filter: HUGGIES_SHIT_ACTIVE_FILTER;
  // true while the first load is running.
  loading: boolean;
  // why the load failed, when it did.
  error: string | null;
}
// ========================================
// --- STATE ------------------------------
// the empty state the page starts from.
let state: HUGGIES_SHIT_1170_STATE = {
  summary: null,
  price: null,
  holders: [],
  holder_total: 0,
  next_cursor: null,
  loading_more: false,
  active_filter: "all",
  loading: true,
  error: null,
};
// the plain array so subscribe/unsubscribe ordering is stable.
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
      console.error("[tokens_page_shit_1170_state] listener failed", err);
    }
  }
}
// ========================================
// --- WRITE ------------------------------
// replace the page's state and tell the subscribers.
function set_state_fun(next: HUGGIES_SHIT_1170_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// --- READ ------------------------------
// the page's state, as it is right now.
function get_state_fun(): HUGGIES_SHIT_1170_STATE {
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
function reset_fun(): void {
  set_state_fun({
    summary: null,
    price: null,
    holders: [],
    holder_total: 0,
    next_cursor: null,
    loading_more: false,
    active_filter: "all",
    loading: true,
    error: null,
  });
}
// ========================================
// --- FILTER ----------------------------
// set the filter the holder list is filtered by.
//
// --- WHY --- the filter lives in the store rather than in the filters
// component's own state: the groups breakdown highlights the group of
// the ACTIVE filter, so both components have to read the same filter.
function set_active_filter_fun(filter: HUGGIES_SHIT_ACTIVE_FILTER): void {
  if (state.active_filter === filter) return;
  set_state_fun({ ...state, active_filter: filter });
}
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_TOKENS_PAGE_SHIT_1170_STATE = {
  get: get_state_fun,
  set: set_state_fun,
  subscribe: subscribe_fun,
  reset: reset_fun,
  set_active_filter: set_active_filter_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
