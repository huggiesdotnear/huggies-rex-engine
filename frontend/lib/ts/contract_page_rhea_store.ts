// ========================================
// the rhea page's shared state: the one load, held here, read by every
// component on the page.
//
// the store has the same shape as lib/ts/app_page_discover_store.ts:
// plain module state, a subscribe/unsubscribe pair, and a notify that a
// throwing subscriber cannot break.
// ========================================
import { HUGGIES_CONTRACT_PAGE_RHEA } from "./contract_page_rhea";
import {
  HUGGIES_DEFAULT_RHEA_POOL_SORT,
  HUGGIES_DEFAULT_RHEA_POOL_SORT_DIRECTION,
  type HUGGIES_RHEA_POOL_SORT,
  type HUGGIES_RHEA_POOL_SORT_DIRECTION,
} from "./contract_page_rhea_pool_sort";
import type {
  HUGGIES_RHEA_PAGE_DATA,
  HUGGIES_RHEA_POOL,
} from "./contract_page_rhea";
import type { RHEA_POOL_SEARCH_TYPE } from "@sleet-js/middleman-rhea-api";
// ========================================
// ========================================
// --- STATE ------------------------------
let data: HUGGIES_RHEA_PAGE_DATA | null = null;
// the view the current load was for: the sort, the direction, the pool
// family and the search. they are one view — a load for one of them must
// not overwrite the rows of another.
let loaded_sort: HUGGIES_RHEA_POOL_SORT = HUGGIES_DEFAULT_RHEA_POOL_SORT;
let loaded_desc = HUGGIES_DEFAULT_RHEA_POOL_SORT_DIRECTION === "desc";
let loaded_type: RHEA_POOL_SEARCH_TYPE = "all";
let loaded_search = "";
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
      console.error("[contract_page_rhea_store] listener failed", err);
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
// load the first page of pools for a view.
//
// the load runs once per view. a second call for the same view while a
// load is running is ignored, so the page cannot fetch twice because two
// components asked for it.
//
// --- WHY --- the previous rows are NOT cleared here. wiping the list on
// every sort change made the page flash "LOADING POOLS..." and show
// nothing, which reads as broken. the old rows stay on screen under the
// loading note until the new ones arrive.
async function load_fun(
  sort: HUGGIES_RHEA_POOL_SORT,
  desc: boolean,
  type: RHEA_POOL_SEARCH_TYPE,
  search: string,
): Promise<void> {
  if (
    loading &&
    loaded_sort === sort &&
    loaded_desc === desc &&
    loaded_type === type &&
    loaded_search === search
  ) {
    return;
  }
  loading = true;
  loaded_sort = sort;
  loaded_desc = desc;
  loaded_type = type;
  loaded_search = search;
  notify_fun();
  try {
    const result = await HUGGIES_CONTRACT_PAGE_RHEA.load(
      sort,
      desc,
      type,
      0,
      search,
    );
    // a load for an older view must not overwrite a newer one.
    if (
      loaded_sort !== sort ||
      loaded_desc !== desc ||
      loaded_type !== type ||
      loaded_search !== search
    ) {
      return;
    }
    data = result;
  } catch (err) {
    if (
      loaded_sort !== sort ||
      loaded_desc !== desc ||
      loaded_type !== type ||
      loaded_search !== search
    ) {
      return;
    }
    data = {
      pools: [],
      total: 0,
      pool_count: 0,
      has_more: false,
      tvl_usd: 0,
      volume_24h_usd: 0,
      errors: [err instanceof Error ? err.message : String(err)],
    };
  } finally {
    if (
      loaded_sort === sort &&
      loaded_desc === desc &&
      loaded_type === type &&
      loaded_search === search
    ) {
      loading = false;
      notify_fun();
    }
  }
}
// ========================================
// load the NEXT page of pools and append it to the rows on screen.
//
// the page is appended rather than replacing, so the reader keeps what
// they scrolled to. a load that fails leaves the rows already on screen
// alone and records the error.
async function load_more_fun(): Promise<void> {
  if (loading || data === null) return;
  // there is nothing more to ask for.
  if (!data.has_more) return;
  loading = true;
  notify_fun();
  try {
    const offset = data.pools.length;
    const result = await HUGGIES_CONTRACT_PAGE_RHEA.load(
      loaded_sort,
      loaded_desc,
      loaded_type,
      offset,
      loaded_search,
    );
    if (data === null) return;
    data = {
      pools: [...data.pools, ...result.pools],
      total: result.total,
      pool_count: result.pool_count,
      has_more: result.has_more,
      tvl_usd: result.tvl_usd,
      volume_24h_usd: result.volume_24h_usd,
      errors: result.errors,
    };
  } catch (err) {
    if (data === null) return;
    data = {
      ...data,
      errors: [
        ...data.errors,
        err instanceof Error ? err.message : String(err),
      ],
    };
  } finally {
    loading = false;
    notify_fun();
  }
}
// ========================================
// ========================================
// --- READ ------------------------------
// the loaded data, or null while it is still loading.
function get_fun(): HUGGIES_RHEA_PAGE_DATA | null {
  return data;
}
// ========================================
function is_loading_fun(): boolean {
  return loading;
}
// ========================================
// the pools on screen. read here so the component has one place to go.
function get_pools_fun(): ReadonlyArray<HUGGIES_RHEA_POOL> {
  return data?.pools ?? [];
}
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_CONTRACT_PAGE_RHEA_STORE = {
  load: load_fun,
  load_more: load_more_fun,
  subscribe: subscribe_fun,
  get: get_fun,
  get_pools: get_pools_fun,
  is_loading: is_loading_fun,
};
// ========================================
// copyright 2026 by sleet.near
