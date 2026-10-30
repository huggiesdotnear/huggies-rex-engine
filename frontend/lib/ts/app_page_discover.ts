// ========================================
// the discover page's ONE load: every fetch the page makes happens here.
//
// read this file to know what the page requests.
//
// WHY this exists
// --- the page used to download EVERY indexed token (about 7,400) in one
// call, cache it for five minutes, and sort the copy in javascript. that was
// stale (the cached rows carry volume, market cap, price and holders, and
// all four move), large (~733KB a visit), and wasteful — the api sorts and
// paginates natively, so the download only existed to be sorted locally.
//
// one loader fetches one page at a time.
//
// WHAT THE PAGE REQUESTS
//   1. GET /tokens   one page of the list, sorted and paged by the api.
//                    one request per page, 300 rows each.
//   2. GET /tokens   the favourites, by id, so they can be pinned on top
//                    of the `default` view.
//   3. GET/POST      the icons for the rows on screen, and only the ones
//                    the durable cache does not already hold. the first
//                    page of a descending list is served by a sorted page
//                    with no ids in the url; anything else is asked for
//                    by id.
//   4. GET           /tokens/search — the search results, when the reader
//                    has typed something.
//
// the icon request is the only one that can be skipped entirely: on a warm
// cache every visible icon is already stored.
// ========================================
import { api_intear_tokens_get } from "@sleet-js/middleman-intear-api";
import { HUGGIES_DISCOVER_TOKEN_LIST } from "./app_page_discover_token_list";
import { fetch_token_icons_fun } from "./app_page_discover_token_icons";
import { search_tokens_fun } from "./app_page_discover_token_search";
import { HUGGIES_PINNED_TOKENS } from "./app_page_discover_pinned_tokens";
import { token_row_by_name_fun } from "./token_row_by_name";
import { token_sort_field_fun } from "./app_page_discover_token_sort";
import type { HUGGIES_TOKEN_SORT } from "./app_page_discover_token_sort";
import type { HUGGIES_TOKEN_SEARCH_RESULT } from "./app_page_discover_token_result";
// ========================================
// ========================================
// --- TYPES ------------------------------
export interface HUGGIES_APP_PAGE_DISCOVER_TOKEN_LIST {
  // the rows on screen.
  rows: HUGGIES_TOKEN_SEARCH_RESULT[];
  // true when the api has more rows behind this one.
  has_more: boolean;
  // how many rows the API has served so far. this is NOT the length of
  // `rows`: the favourites are added to the rows and were never part of
  // the api's own paging, so the next page has to start after the api's
  // count, not after the rows on screen.
  fetched: number;
}
// ========================================
// everything the discover page has loaded.
export interface HUGGIES_APP_PAGE_DISCOVER_DATA {
  // the token list, page by page.
  token_list: HUGGIES_APP_PAGE_DISCOVER_TOKEN_LIST;
  // the search results, when the reader has typed something.
  search: HUGGIES_TOKEN_SEARCH_RESULT[] | null;
  // the icons for the rows on screen, by token id.
  icons: Record<string, string>;
  // one message per thing that failed.
  errors: ReadonlyArray<string>;
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// ========================================
// --- FAVOURITES ------------------------
// fetch the marked tokens by id, so the `default` view can put them on
// top.
//
// --- WHY --- by id and not by sort: the api cannot sort by "our
// favourites", so they are asked for directly.
//
// --- WHY --- over POST and not GET: a near account id is 64 hex
// characters and a token id adds a label on top, so a list of ids does
// not fit the api's ~8KB url limit. POST carries them in a body with a
// 64KB limit.
async function fetch_favourites_fun(): Promise<HUGGIES_TOKEN_SEARCH_RESULT[]> {
  const ids = HUGGIES_PINNED_TOKENS.map((entry) => entry.id);
  if (ids.length === 0) return [];
  const response = await api_intear_tokens_get({
    fields: [
      "name",
      "symbol",
      "decimals",
      "price_usd",
      "reputation",
      "holders",
      "volume_usd_24h",
      "market_cap_usd",
    ],
    ids,
  });
  // the rows come back keyed by id; the caller pins them by their own
  // weight. a token the api does not know is simply absent.
  //
  // --- WHY --- the same field set as the list page, so a marked token
  // carries its real volume, market cap and holders. asking for fewer
  // fields left those at zero, and a row reading "$0 MCAP" is a lie
  // the reader cannot see is a lie.
  //
  // --- WHY --- the row is read by column NAME, not by index: the api
  // always returns `account_id` as the first column, even when it was
  // not requested, so a fixed index read is shifted by one.
  const columns = response.columns;
  return response.rows.map((row) => {
    const cell = token_row_by_name_fun(columns, row);
    const id = typeof cell.account_id === "string" ? cell.account_id : "";
    const name = cell.name;
    const symbol = cell.symbol;
    const reputation = cell.reputation;
    return {
      id,
      name: typeof name === "string" && name.length > 0 ? name : id,
      symbol: typeof symbol === "string" && symbol.length > 0 ? symbol : id,
      decimals: to_finite_number_fun(cell.decimals),
      icon: null,
      price_usd: to_finite_number_fun(cell.price_usd),
      reputation: typeof reputation === "string" ? reputation : "Unknown",
      holders: to_finite_number_fun(cell.holders),
      volume_usd_24h: to_finite_number_fun(cell.volume_usd_24h),
      market_cap_usd: to_finite_number_fun(cell.market_cap_usd),
    };
  });
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// fetch one page of the token list, plus the rows of the favourites.
//
// --- WHY --- the favourites ride along with the FIRST page only. they
// are extra rows for the `default` view, and on the later pages they
// would be a duplicate of rows already shown.
//
// --- WHY --- the favourites and the page are fetched together, so the
// page is as slow as its slowest request, not the sum of the two.
async function load_token_list_fun(
  sort: HUGGIES_TOKEN_SORT,
  desc: boolean,
  offset: number,
): Promise<HUGGIES_APP_PAGE_DISCOVER_TOKEN_LIST> {
  const [page, favourites] = await Promise.all([
    HUGGIES_DISCOVER_TOKEN_LIST.fetch(sort, desc, offset),
    offset === 0 && sort === "default"
      ? fetch_favourites_fun()
      : Promise.resolve([]),
  ]);
  // the favourite rows are ADDED to the api's page. where they sit is
  // NOT decided here: the order module (app_page_discover_token_order.ts)
  // lifts them to the top of the `default` view, on every page, and it
  // is the only place that does it.
  //
  // --- WHY --- a favourite that is also in this page is not added
  // twice.
  const page_ids = new Set(page.rows.map((row) => row.id));
  const extra = favourites.filter((row) => !page_ids.has(row.id));
  return {
    rows: [...page.rows, ...extra],
    has_more: page.has_more,
    // the api's own count, without the favourites we added.
    fetched: page.fetched,
  };
}
// ========================================
// fetch the icons for a set of rows, using the durable cache first.
//
// --- WHY --- `sort` says the rows ARE the top of that sort, so the api
// can serve them as one sorted page with no ids in the url at all. it
// is given only for the FIRST page of a descending list, where that is
// true. a later page of the list starts where the top ended, and a
// search result is a handful of arbitrary tokens — neither is the top
// of the sort, so the sorted page would cover none of them and their
// icons are asked for by id instead.
async function load_icons_fun(
  rows: ReadonlyArray<HUGGIES_TOKEN_SEARCH_RESULT>,
  sort?: HUGGIES_TOKEN_SORT,
  desc?: boolean,
): Promise<Record<string, string>> {
  const ids = rows.map((row) => row.id);
  const source =
    sort === undefined
      ? undefined
      : { by: token_sort_field_fun(sort), desc: desc === true };
  const found = await fetch_token_icons_fun(ids, source);
  const out: Record<string, string> = {};
  for (const [id, icon] of found) out[id] = icon;
  return out;
}
// ========================================
// ========================================
// --- SEARCH ----------------------------
// search the api for tokens matching a query.
//
// --- WHY --- the api has a real search index behind /tokens/search,
// matching symbol, name, account id and social links. filtering a
// downloaded list in javascript only ever sees the tokens we happened
// to download, so a token outside that set was unfindable.
async function load_search_fun(
  query: string,
): Promise<HUGGIES_TOKEN_SEARCH_RESULT[]> {
  return search_tokens_fun(query);
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_DISCOVER = {
  load_token_list: load_token_list_fun,
  load_icons: load_icons_fun,
  load_favourites: fetch_favourites_fun,
  search: load_search_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
