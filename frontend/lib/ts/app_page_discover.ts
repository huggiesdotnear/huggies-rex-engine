// ========================================
// the discover page's ONE load: every fetch the page makes happens
// here.
//
// read this file to know what the discover page requests. that is the
// whole point of it.
//
// WHY this exists
// --- the discover page used to download EVERY indexed token (about
// 7,400) in one call, cache it in indexeddb for five minutes, and
// sort the copy in javascript. that was stale (the cached rows carry
// volume, market cap, price and holders, and all four move), large
// (~733KB a visit), and wasteful — the api sorts and paginates
// natively, so the whole download only existed to be sorted locally.
//
// one loader fetches one page at a time. the components read the
// result and fetch nothing themselves, so the page's request list is
// knowable by reading one file.
//
// WHAT THE PAGE REQUESTS
//   1. GET /tokens   one page of the list, sorted and paged by the
//                    api. one request per page, 300 rows each.
//   2. GET /tokens   the favourites, by id, so they can be pinned on
//                    top of the `default` view.
//   3. GET /tokens   the icons for the rows on screen, and only the
//                    ones the durable cache does not already hold.
//   4. GET /tokens   the search results, when the reader has typed
//                    something. the api has a real search index.
//
// the icon request is the only one that can be skipped entirely: on a
// warm cache every visible icon is already stored.
// ========================================
import { api_intear_tokens_get } from "../../../middleman";
import { HUGGIES_DISCOVER_TOKEN_PAGE } from "./app_page_discover_token_page";
import { fetch_token_icons_fun } from "./app_page_discover_token_icons";
import { search_tokens_fun } from "./app_page_discover_token_search";
import { HUGGIES_PINNED_TOKENS } from "./app_page_discover_pinned_tokens";
import { token_sort_field_fun } from "./app_page_discover_token_sort";
import type { HUGGIES_TOKEN_SORT } from "./app_page_discover_token_sort";
import type { HUGGIES_TOKEN_SEARCH_RESULT } from "./app_page_discover_token_result";
// ========================================
// ========================================
// --- TYPES ------------------------------
// one page of the token list, as the page holds it.
export interface HUGGIES_APP_PAGE_DISCOVER_TOKENS {
  // the rows on screen.
  rows: HUGGIES_TOKEN_SEARCH_RESULT[];
  // true when the api has more rows behind this one.
  has_more: boolean;
  // how many rows the API has served so far. this is NOT the length of
  // `rows`: the favourites are pinned on top of the first page and
  // were never part of the api's own paging, so the next page has to
  // start after the api's count, not after the rows on screen.
  fetched: number;
}
// ========================================
// everything the discover page has loaded.
export interface HUGGIES_APP_PAGE_DISCOVER_DATA {
  // the token list, page by page.
  tokens: HUGGIES_APP_PAGE_DISCOVER_TOKENS;
  // the search results, when the reader has typed something.
  search: HUGGIES_TOKEN_SEARCH_RESULT[] | null;
  // the icons for the rows on screen, by token id.
  icons: Record<string, string>;
  // one message per thing that failed.
  errors: ReadonlyArray<string>;
}
// ========================================
// ========================================
// --- FAVOURITES ------------------------
// fetch the marked tokens by id, so the `default` view can put them on
// top of the page.
//
// --- WHY --- by id and not by sort: the api cannot sort by "our
// favourites", so they are asked for directly. the ids are few, so
// this is one small request.
//
// --- WHY --- over POST and not GET: a near account id is 64 hex
// characters and a token id adds a label on top, so a list of ids does
// not fit the api's ~8KB url limit. POST carries them in a body with a
// 64KB limit instead.
async function fetch_favourites_fun(): Promise<HUGGIES_TOKEN_SEARCH_RESULT[]> {
  const ids = HUGGIES_PINNED_TOKENS.map((entry) => entry.id);
  if (ids.length === 0) return [];
  const response = await api_intear_tokens_get({
    fields: ["name", "symbol", "decimals", "price_usd", "reputation"],
    ids,
  });
  // the rows come back keyed by id; the order the api returned them in
  // is not the order we want, so the caller pins them by their own
  // weight. a token the api does not know is simply absent.
  return response.rows.map((row) => ({
    id: String(row[0]),
    name: typeof row[1] === "string" && row[1].length > 0 ? row[1] : String(row[0]),
    symbol: typeof row[2] === "string" && row[2].length > 0 ? row[2] : String(row[0]),
    decimals: typeof row[3] === "number" ? row[3] : 0,
    icon: null,
    price_usd: Number(row[4] ?? 0),
    reputation: "Unknown",
    holders: 0,
    volume_usd_24h: 0,
    market_cap_usd: 0,
  }));
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// fetch one page of the token list, plus the icons for its rows.
//
// --- WHY --- the favourites ride along with the FIRST page only. the
// `default` view leads with them, so they belong at the top of the
// list. on the later pages they would be a duplicate of rows already
// shown, so only the first page carries them.
//
// --- WHY --- the favourites and the page are fetched at the same time:
// neither waits for the other, so the page is as slow as its slowest
// request rather than the sum of the two.
async function load_tokens_page_fun(
  sort: HUGGIES_TOKEN_SORT,
  desc: boolean,
  offset: number,
): Promise<HUGGIES_APP_PAGE_DISCOVER_TOKENS> {
  const [page, favourites] = await Promise.all([
    HUGGIES_DISCOVER_TOKEN_PAGE.fetch(sort, desc, offset),
    offset === 0 && sort === "default"
      ? fetch_favourites_fun()
      : Promise.resolve([]),
  ]);
  // the favourites are pinned on top of the first page. a favourite
  // that is also in the page itself is not shown twice.
  const page_ids = new Set(page.rows.map((row) => row.id));
  const pinned = favourites.filter((row) => !page_ids.has(row.id));
  return {
    rows: [...pinned, ...page.rows],
    has_more: page.has_more,
    // the api's own count, without the favourites we added.
    fetched: page.fetched,
  };
}
// ========================================
// fetch the icons for a set of rows, using the durable cache first.
async function load_icons_fun(
  rows: ReadonlyArray<HUGGIES_TOKEN_SEARCH_RESULT>,
  sort: HUGGIES_TOKEN_SORT,
  desc: boolean,
): Promise<Record<string, string>> {
  const ids = rows.map((row) => row.id);
  const found = await fetch_token_icons_fun(ids, {
    by: token_sort_field_fun(sort),
    desc,
  });
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
// to download, so a token outside that set was unfindable however the
// reader typed.
async function load_search_fun(
  query: string,
): Promise<HUGGIES_TOKEN_SEARCH_RESULT[]> {
  return search_tokens_fun(query);
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// the page's load surface. one call per thing the page loads.
export const HUGGIES_APP_PAGE_DISCOVER = {
  load_tokens_page: load_tokens_page_fun,
  load_icons: load_icons_fun,
  load_favourites: fetch_favourites_fun,
  search: load_search_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
