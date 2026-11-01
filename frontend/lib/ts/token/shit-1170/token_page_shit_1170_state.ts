// ========================================
// the $SHIT page's shared state: the one load, held here, read by every
// component on the page.
//
// the components do not fetch. they read this store. there is exactly
// one loader (lib/ts/token_page_shit_1170.ts), so the page's request
// list is knowable.
//
// the shape is the same as lib/ts/token_page_token_state.ts: plain
// module state, a subscribe/unsubscribe pair, and a notify that a
// throwing subscriber cannot break.
import { HUGGIES_TOKEN_PAGE_SHIT_1170 } from "./token_page_shit_1170";
import type { HUGGIES_SHIT_SUMMARY } from "./token_page_shit_1170_summary";
import type { HUGGIES_SHIT_HOLDER } from "./token_page_shit_1170_holders";
import type { HUGGIES_SHIT_HOLDER_ROW_TYPE } from "./token_page_shit_1170_known_holders";
// ========================================
// ========================================
// --- TYPES -----------------------------
// the filter currently applied to the holder list. it is a holder ROW
// type ("dev"|"dex"|"vault"|"nft"|"burn"|"regular") or "all".
export type HUGGIES_SHIT_ACTIVE_FILTER = HUGGIES_SHIT_HOLDER_ROW_TYPE | "all";
// ========================================
// the page's state. the empty state is what the page holds before the
// first load answers.
export interface HUGGIES_SHIT_1170_STATE {
  // the token's summary, once it has loaded. it carries the price, so
  // the page needs no separate price request.
  summary: HUGGIES_SHIT_SUMMARY | null;
  // the holder rows loaded so far.
  holders: HUGGIES_SHIT_HOLDER[];
  holder_total: number;
  // the cursor for the next holder page, or null when there is none.
  next_cursor: string | null;
  loading_more: boolean;
  // the filter the reader picked.
  active_filter: HUGGIES_SHIT_ACTIVE_FILTER;
  loading: boolean;
  error: string | null;
}
// ========================================
// --- STATE ------------------------------
// the empty state the page starts from.
let state: HUGGIES_SHIT_1170_STATE = {
  summary: null,
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
// true while the page's load is running.
let loading = false;
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing (or
// unsubscribing mid-notify) cannot break the flow that notified.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[token_page_shit_1170_state] listener failed", err);
    }
  }
}
// ========================================
// --- WRITE ------------------------------
function set_state_fun(next: HUGGIES_SHIT_1170_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// --- READ ------------------------------
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
function reset_fun(): void {
  set_state_fun({
    summary: null,
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
// --- WHY --- the filter lives in the store rather than in the filters
// component's own state: the groups breakdown highlights the group of the
// ACTIVE filter, so both components have to read the same filter.
function set_active_filter_fun(filter: HUGGIES_SHIT_ACTIVE_FILTER): void {
  if (state.active_filter === filter) return;
  set_state_fun({ ...state, active_filter: filter });
}
// ========================================
// --- LOAD -------------------------------
// the load runs once. a second call while a load is running is ignored,
// so the page cannot fetch twice because two components asked for it.
//
// --- WHY --- the summary loads before the holders, and there is no
// separate price request: the summary carries the price, the decimals
// and the total supply, and the holder rows need all three. see
// token_page_shit_1170.ts.
async function token_page_shit_1170_state_load_fun(): Promise<void> {
  if (loading) return;
  loading = true;
  reset_fun();
  notify_fun();
  try {
    const summary = await HUGGIES_TOKEN_PAGE_SHIT_1170.load_summary();
    const price_usd = summary?.price_usd ?? 0;
    const total_supply_raw = HUGGIES_TOKEN_PAGE_SHIT_1170.bigint_or_zero(
      summary?.total_supply_raw ?? "0",
    );
    const page = await HUGGIES_TOKEN_PAGE_SHIT_1170.load_holders(
      null,
      price_usd,
      summary?.decimals ?? 18,
      total_supply_raw,
    );
    set_state_fun({
      ...state,
      summary,
      holders: page.rows,
      holder_total: page.total,
      next_cursor: page.next_cursor,
      loading_more: false,
      loading: false,
      error: null,
    });
  } catch (err) {
    set_state_fun({
      ...state,
      loading: false,
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    loading = false;
    notify_fun();
  }
}
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_TOKEN_PAGE_SHIT_1170_STATE = {
  get: get_state_fun,
  set: set_state_fun,
  subscribe: subscribe_fun,
  reset: reset_fun,
  set_active_filter: set_active_filter_fun,
  load: token_page_shit_1170_state_load_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
