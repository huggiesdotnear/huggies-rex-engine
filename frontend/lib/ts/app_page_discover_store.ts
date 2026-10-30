// ========================================
// the discover page's shared state: the one load, held here, read by every
// component on the page.
//
// the components on this page do not fetch. they read this store, so there
// is exactly one loader (lib/ts/app_page_discover.ts).
//
// the store has the same shape as lib/ts/app_page_account_store.ts: plain
// module state, a subscribe/unsubscribe pair, and a notify a throwing
// subscriber cannot break.
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
// the direction the current load was for. the sort and the direction
// are one view: a load for one direction must not overwrite the rows
// of the other.
let loaded_desc = true;
// true while a LIST load is running.
let loading_list = false;
// true while a SEARCH is running.
//
// --- WHY --- the list and the search have their own flags. they can
// be in flight at the same time — the reader types while the first
// page is still loading — and one shared flag made one wait for the
// other, which showed as a page that never finished loading.
let loading_search = false;
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
      console.error("[app_page_discover_store] listener failed", err);
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
// --- LOAD -------------------------------
// the load runs once per sort. a second call for the same sort while a
// load is running is ignored, so the page cannot fetch twice because two
// components asked for it.
//
// --- WHY --- the previous rows are NOT cleared here. wiping the list on
// every sort change made the page flash "LOADING TOKENS..." and show
// nothing, which reads as broken.
//
// --- WHY --- the sort AND the direction are both remembered. they are
// one view, and a load for one direction must not overwrite the rows of
// the other: the reader can flip the direction twice while a request is
// in flight, and the last answer has to win.
async function load_fun(
  sort: HUGGIES_TOKEN_SORT,
  desc: boolean,
): Promise<void> {
  if (loading_list && loaded_sort === sort && loaded_desc === desc) return;
  loading_list = true;
  loaded_sort = sort;
  loaded_desc = desc;
  notify_fun();
  try {
    const token_list = await HUGGIES_APP_PAGE_DISCOVER.load_token_list(
      sort,
      desc,
      0,
    );
    // a load for an older sort must not overwrite a newer one.
    if (loaded_sort !== sort || loaded_desc !== desc) return;
    // the icons for the rows on screen. the cache is read first, so
    // on a warm cache this costs no network at all.
    //
    // --- WHY --- the sort is passed because these rows ARE the top of
    // it: this is the first page of the list, and a descending list
    // starts at the top. so the api can serve the icons as one sorted
    // page with no ids in the url. the later pages and the search
    // results are not the top of a sort, and their icons are asked for
    // by id.
    const icons = await HUGGIES_APP_PAGE_DISCOVER.load_icons(
      token_list.rows,
      sort,
      desc,
    );
    if (loaded_sort !== sort || loaded_desc !== desc) return;
    // the search results are DROPPED here. the reader changed the sort
    // while a search was on screen — showing the old rows under a new
    // sort is showing one list under another's label.
    data = { token_list, search: null, icons, errors: [] };
  } catch (err) {
    if (loaded_sort !== sort || loaded_desc !== desc) return;
    data = {
      token_list: { rows: [], has_more: false, fetched: 0 },
      search: null,
      icons: {},
      errors: [err instanceof Error ? err.message : String(err)],
    };
  } finally {
    if (loaded_sort === sort && loaded_desc === desc) {
      loading_list = false;
      notify_fun();
    }
  }
}
// ========================================
// load the NEXT page of the list and append it to the rows on screen.
//
// the page is appended rather than replacing, so the reader keeps what
// they scrolled to. a load that fails leaves the rows on screen alone
// and records the error.
async function load_more_fun(
  sort: HUGGIES_TOKEN_SORT,
  desc: boolean,
): Promise<void> {
  if (loading_list || data === null) return;
  // the next page belongs to the view on screen. if the reader changed
  // the sort or the direction since, this page is for a view that is
  // gone.
  if (loaded_sort !== sort || loaded_desc !== desc) return;
  loading_list = true;
  notify_fun();
  try {
    // the offset is the api's own count, not the length of the rows on
    // screen: the favourites are added to the rows and were never part
    // of the api's paging, so counting them would skip rows at the
    // start of the next page.
    const offset = data.token_list.fetched;
    const next = await HUGGIES_APP_PAGE_DISCOVER.load_token_list(
      sort,
      desc,
      offset,
    );
    // a sort change while this page was in flight means these rows
    // belong to a view that is no longer on screen.
    if (loaded_sort !== sort || loaded_desc !== desc) return;
    // --- WHY --- no sort is passed here. these rows are the NEXT page
    // of the list, so they start where the top of the sort ended and
    // the api's sorted page would cover none of them. their icons are
    // asked for by id.
    const icons = await HUGGIES_APP_PAGE_DISCOVER.load_icons(next.rows);
    if (loaded_sort !== sort || loaded_desc !== desc) return;
    data = {
      ...data,
      token_list: {
        rows: [...data.token_list.rows, ...next.rows],
        has_more: next.has_more,
        fetched: next.fetched,
      },
      icons: { ...data.icons, ...icons },
    };
  } catch (err) {
    if (loaded_sort !== sort || loaded_desc !== desc) return;
    data = {
      ...data,
      errors: [
        ...data.errors,
        err instanceof Error ? err.message : String(err),
      ],
    };
  } finally {
    loading_list = false;
    notify_fun();
  }
}
// ========================================
// the search results live in their own field, beside the list rows.
// the component shows whichever one applies.
async function search_fun(query: string): Promise<void> {
  // --- WHY --- a search is NOT dropped when a load is running. the
  // reader can type while the first page is still in flight, and
  // dropping the search meant the page sat on "SEARCHING..." forever
  // with no results and no error.
  loading_search = true;
  notify_fun();
  try {
    const rows = await HUGGIES_APP_PAGE_DISCOVER.search(query);
    // --- WHY --- no sort is passed here. the search results are a
    // handful of arbitrary tokens — they are NOT the top of any sort,
    // so the api's sorted page would cover none of them and would cost
    // a page of icons for nothing. their icons are asked for by id.
    const icons = await HUGGIES_APP_PAGE_DISCOVER.load_icons(rows);
    // --- WHY --- the list rows are KEPT. the search results live in
    // their own field, and the component shows whichever one applies.
    // clearing the list meant clearing the search box left an empty
    // page until the list was fetched again.
    data = {
      ...(data ?? {
        token_list: { rows: [], has_more: false, fetched: 0 },
        search: null,
        icons: {},
        errors: [],
      }),
      search: rows,
      icons: { ...(data?.icons ?? {}), ...icons },
    };
  } catch (err) {
    data = {
      ...(data ?? {
        token_list: { rows: [], has_more: false, fetched: 0 },
        search: null,
        icons: {},
        errors: [],
      }),
      search: [],
      errors: [
        ...(data?.errors ?? []),
        err instanceof Error ? err.message : String(err),
      ],
    };
  } finally {
    loading_search = false;
    notify_fun();
  }
}
// ========================================
// --- WHY --- the list itself was never touched, so clearing the search
// brings it back instantly.
function clear_search_fun(): void {
  if (data === null || data.search === null) return;
  data = { ...data, search: null };
  notify_fun();
}
// ========================================
// ========================================
// --- READ ------------------------------
function get_fun(): HUGGIES_APP_PAGE_DISCOVER_DATA | null {
  return data;
}
// ========================================
// true while a LIST load is running.
function is_loading_fun(): boolean {
  return loading_list;
}
// ========================================
// true while a SEARCH is running.
function is_searching_fun(): boolean {
  return loading_search;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_DISCOVER_STORE = {
  load: load_fun,
  load_more: load_more_fun,
  search: search_fun,
  clear_search: clear_search_fun,
  subscribe: subscribe_fun,
  get: get_fun,
  is_loading: is_loading_fun,
  is_searching: is_searching_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
