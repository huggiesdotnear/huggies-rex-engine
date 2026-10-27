// ========================================
// the discover page's shared state: the one load, held here, read by
// every component on the page.
//
// the components on this page do not fetch. they read this store. that
// is what makes the page's request list knowable — there is exactly
// one loader (lib/ts/app_page_discover.ts), so there is exactly one
// set of requests.
//
// the store has the same shape as lib/ts/app_page_account_store.ts:
// plain module state, a subscribe/unsubscribe pair, and a notify that
// a throwing subscriber cannot break.
import { HUGGIES_APP_PAGE_DISCOVER } from "./app_page_discover";
import type { HUGGIES_APP_PAGE_DISCOVER_DATA } from "./app_page_discover";
import type { HUGGIES_TOKEN_SORT } from "./app_page_discover_token_sort";
// ========================================
// ========================================
// --- STATE ------------------------------
// the loaded data, or null while it is still loading.
let data: HUGGIES_APP_PAGE_DISCOVER_DATA | null = null;
// the sort the current load was for, so a new sort starts a new load
// and clears the old rows.
let loaded_sort: HUGGIES_TOKEN_SORT | null = null;
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
      console.error("[app_page_discover_store] listener failed", err);
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
// load the first page of the token list for a sort.
//
// the load runs once per sort. a second call for the same sort while
// a load is running is ignored, so the page cannot fetch twice because
// two components asked for it.
async function load_fun(
  sort: HUGGIES_TOKEN_SORT,
  desc: boolean,
): Promise<void> {
  if (loading && loaded_sort === sort) return;
  loading = true;
  loaded_sort = sort;
  data = null;
  notify_fun();
  try {
    const tokens = await HUGGIES_APP_PAGE_DISCOVER.load_tokens_page(
      sort,
      desc,
      0,
    );
    // a load for an older sort must not overwrite a newer one.
    if (loaded_sort !== sort) return;
    // the icons for the rows on screen. the cache is read first, so
    // on a warm cache this costs no network at all.
    const icons = await HUGGIES_APP_PAGE_DISCOVER.load_icons(
      tokens.rows,
      sort,
      desc,
    );
    if (loaded_sort !== sort) return;
    data = { tokens, search: null, icons, errors: [] };
  } catch (err) {
    if (loaded_sort !== sort) return;
    data = {
      tokens: { rows: [], has_more: false, fetched: 0 },
      search: null,
      icons: {},
      errors: [err instanceof Error ? err.message : String(err)],
    };
  } finally {
    if (loaded_sort === sort) {
      loading = false;
      notify_fun();
    }
  }
}
// ========================================
// load the NEXT page of the list and append it to the rows on screen.
//
// the page is appended rather than replacing, so the reader keeps what
// they scrolled to. a load that fails leaves the rows already on
// screen alone and records the error.
async function load_more_fun(
  sort: HUGGIES_TOKEN_SORT,
  desc: boolean,
): Promise<void> {
  if (loading || data === null) return;
  loading = true;
  notify_fun();
  try {
    // the offset is the api's own count, not the length of the rows on
    // screen: the favourites are pinned on top of the first page and
    // were never part of the api's paging, so counting them would
    // skip rows at the start of the next page.
    const offset = data.tokens.fetched;
    const next = await HUGGIES_APP_PAGE_DISCOVER.load_tokens_page(
      sort,
      desc,
      offset,
    );
    const icons = await HUGGIES_APP_PAGE_DISCOVER.load_icons(
      next.rows,
      sort,
      desc,
    );
    data = {
      ...data,
      tokens: {
        rows: [...data.tokens.rows, ...next.rows],
        has_more: next.has_more,
        fetched: next.fetched,
      },
      icons: { ...data.icons, ...icons },
    };
  } catch (err) {
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
// run a search and hold its results.
//
// a search REPLACES the list rows: when the reader types, the list is
// no longer a list, it is the answer to their question.
async function search_fun(query: string): Promise<void> {
  if (loading) return;
  loading = true;
  notify_fun();
  try {
    const rows = await HUGGIES_APP_PAGE_DISCOVER.search(query);
    const icons = await HUGGIES_APP_PAGE_DISCOVER.load_icons(
      rows,
      "volume_usd_24h",
      true,
    );
    data = {
      tokens: { rows: [], has_more: false, fetched: 0 },
      search: rows,
      icons,
      errors: [],
    };
  } catch (err) {
    data = {
      ...(data ?? {
        tokens: { rows: [], has_more: false, fetched: 0 },
        search: null,
        icons: {},
        errors: [],
      }),
      search: [],
      errors: [
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
function get_data_fun(): HUGGIES_APP_PAGE_DISCOVER_DATA | null {
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
export const HUGGIES_APP_PAGE_DISCOVER_STORE = {
  load: load_fun,
  load_more: load_more_fun,
  search: search_fun,
  subscribe: subscribe_fun,
  get_data: get_data_fun,
  is_loading: is_loading_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
