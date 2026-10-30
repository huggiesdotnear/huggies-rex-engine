// ========================================
// the intear dex page's shared state: the one load, held here, read by
// every component on the page.
//
// the components on this page do not fetch. they read this store. that
// is what makes the page's request list knowable — there is exactly one
// loader (lib/ts/contract_page_intear_dex.ts), so there is exactly one
// set of requests.
//
// --- WHY --- the sort lives HERE and not in the component: the dex api
// has no sort of its own, so the rows are ordered here, over the rows
// the loader already fetched. the component then reads the ordered
// list from the store, so the header and the list agree on the order.
//
// the store has the same shape as lib/ts/contract_page_rhea_store.ts:
// plain module state, a subscribe/unsubscribe pair, and a notify that a
// throwing subscriber cannot break.
// ========================================
import { HUGGIES_CONTRACT_PAGE_INTEAR_DEX } from "./contract_page_intear_dex";
import {
  HUGGIES_DEFAULT_INTEAR_DEX_POOL_SORT,
  HUGGIES_DEFAULT_INTEAR_DEX_POOL_SORT_DIRECTION,
  type HUGGIES_INTEAR_DEX_POOL_SORT,
  type HUGGIES_INTEAR_DEX_POOL_SORT_DIRECTION,
} from "./contract_page_intear_dex_pool_sort";
import type {
  HUGGIES_INTEAR_DEX_PAGE_DATA,
  HUGGIES_INTEAR_DEX_POOL,
} from "./contract_page_intear_dex";
// ========================================
// ========================================
// --- STATE ------------------------------
// the loaded data, or null while it is still loading.
let data: HUGGIES_INTEAR_DEX_PAGE_DATA | null = null;
// the sort the reader has chosen. the dex api does not sort, so this
// is ours.
let sort: HUGGIES_INTEAR_DEX_POOL_SORT = HUGGIES_DEFAULT_INTEAR_DEX_POOL_SORT;
let direction: HUGGIES_INTEAR_DEX_POOL_SORT_DIRECTION =
  HUGGIES_DEFAULT_INTEAR_DEX_POOL_SORT_DIRECTION;
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
      console.error("[contract_page_intear_dex_store] listener failed", err);
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
// --- ORDER -----------------------------
// the numeric field a sort key orders by.
function pool_sort_value_fun(
  pool: HUGGIES_INTEAR_DEX_POOL,
  key: HUGGIES_INTEAR_DEX_POOL_SORT,
): number {
  if (key === "volume_24h") return pool.volume_24h_usd;
  if (key === "volume_7d") return pool.volume_7d_usd;
  if (key === "apy") return pool.apy;
  return pool.tvl_usd;
}
// ========================================
// order the pools by the chosen sort and direction.
//
// --- WHY --- the sort is a stable one and not a plain reverse: two
// pools with the same tvl must keep the order the api sent them in,
// so flipping the direction does not shuffle them.
function order_pools_fun(
  pools: ReadonlyArray<HUGGIES_INTEAR_DEX_POOL>,
  key: HUGGIES_INTEAR_DEX_POOL_SORT,
  dir: HUGGIES_INTEAR_DEX_POOL_SORT_DIRECTION,
): HUGGIES_INTEAR_DEX_POOL[] {
  const sorted = [...pools];
  sorted.sort((a, b) => {
    const left = pool_sort_value_fun(a, key);
    const right = pool_sort_value_fun(b, key);
    if (left === right) return 0;
    return left < right ? -1 : 1;
  });
  return dir === "desc" ? sorted.reverse() : sorted;
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// load the page's data.
//
// the load runs once. a second call while a load is running is
// ignored, so the page cannot fetch twice because two components asked
// for it.
//
// --- WHY --- the previous rows are NOT cleared here. the api takes a
// moment to answer, and wiping the list made the page flash "LOADING
// POOLS..." and show nothing, which reads as broken. the old rows stay
// on screen under the loading note until the new ones arrive.
async function load_fun(): Promise<void> {
  if (loading) return;
  loading = true;
  notify_fun();
  try {
    const result = await HUGGIES_CONTRACT_PAGE_INTEAR_DEX.load();
    data = result;
  } catch (err) {
    data = {
      pools: [],
      tvl_usd: 0,
      volume_24h_usd: 0,
      errors: [err instanceof Error ? err.message : String(err)],
    };
  } finally {
    loading = false;
    notify_fun();
  }
}
// ========================================
// set the sort. the rows are already loaded, so this only re-orders
// them — it costs no request.
function set_sort_fun(next: HUGGIES_INTEAR_DEX_POOL_SORT): void {
  sort = next;
  notify_fun();
}
// ========================================
// set the direction. the rows are already loaded, so this only
// re-orders them — it costs no request.
function set_direction_fun(next: HUGGIES_INTEAR_DEX_POOL_SORT_DIRECTION): void {
  direction = next;
  notify_fun();
}
// ========================================
// ========================================
// --- READ ------------------------------
// the loaded data, or null while it is still loading.
function get_fun(): HUGGIES_INTEAR_DEX_PAGE_DATA | null {
  return data;
}
// ========================================
// true while a load is running.
function is_loading_fun(): boolean {
  return loading;
}
// ========================================
// the pools on screen, in the order the reader chose.
function get_pools_fun(): ReadonlyArray<HUGGIES_INTEAR_DEX_POOL> {
  const pools = data?.pools ?? [];
  return order_pools_fun(pools, sort, direction);
}
// ========================================
// the chosen sort, so a component can show it as the active button.
function get_sort_fun(): HUGGIES_INTEAR_DEX_POOL_SORT {
  return sort;
}
// ========================================
// the chosen direction, so a component can show it as the active
// button.
function get_direction_fun(): HUGGIES_INTEAR_DEX_POOL_SORT_DIRECTION {
  return direction;
}
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_CONTRACT_PAGE_INTEAR_DEX_STORE = {
  load: load_fun,
  set_sort: set_sort_fun,
  set_direction: set_direction_fun,
  subscribe: subscribe_fun,
  get: get_fun,
  get_pools: get_pools_fun,
  get_sort: get_sort_fun,
  get_direction: get_direction_fun,
  is_loading: is_loading_fun,
};
// ========================================
// copyright 2026 by sleet.near
