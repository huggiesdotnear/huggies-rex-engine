// ========================================
// one page of the discover token list, straight from the intear api.
//
// --- WHY --- the list used to be downloaded whole: every indexed token
// (about 7,400) was fetched in one call and cached in indexeddb for
// five minutes, and the sort was applied in javascript. that had three
// problems:
//
//   1. STALENESS. the cached rows carry volume, market cap, price and
//      holders, and all four move. a five minute old list showed
//      numbers that disagreed with the token's own page.
//   2. SIZE. the whole set without icons is ~733KB on every cold
//      visit, to show a screenful.
//   3. WASTE. sorting in javascript is why the whole set was needed,
//      and the set was cached because it was expensive — a loop the
//      api already breaks.
//
// the api sorts and paginates natively. this file asks for one page
// at a time, so the list is always current and a visit costs one
// small request instead of a large one.
//
// the pinned ("default") sort is the one thing the api cannot do, so
// the favourites are fetched by id and pinned on top of the volume
// page — see app_page_discover_token_order.ts.
// ========================================
import { api_intear_tokens_get } from "../../../middleman";
import { token_row_by_name_fun } from "./token_row_by_name";
import { token_sort_field_fun } from "./app_page_discover_token_sort";
import type { HUGGIES_TOKEN_SORT } from "./app_page_discover_token_sort";
import type { HUGGIES_TOKEN_SEARCH_RESULT } from "./app_page_discover_token_result";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the fields the discover list shows.
//
// `icon` is NOT in this list: it is a full base64 data uri, and
// asking for it on every token costs ~21MB. icons are fetched
// separately for the rows on screen, and cached durably — see
// app_page_discover_token_icons.ts.
const HUGGIES_TOKEN_LIST_FIELDS = [
  "name",
  "symbol",
  "decimals",
  "price_usd",
  "reputation",
  "holders",
  "volume_usd_24h",
  "market_cap_usd",
] as const;
// how many rows one page holds. the list scrolls, so this is how many
// icons get fetched for it.
export const HUGGIES_TOKEN_PAGE_SIZE = 300;
// ========================================
// ========================================
// --- HELPERS ----------------------------
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// map an API token row into the display record used by discover.
// --- WHY --- the row is read by column NAME, not by index: the api
// always returns `account_id` as the first column, even when it was
// not requested, so a fixed index read is shifted by one — which is
// what made every token render without its icon (the icon slot got
// the price, which is not a string) and every symbol fall back to
// the token id.
function map_token_row_fun(
  columns: ReadonlyArray<string>,
  row: readonly (string | number | null)[],
): HUGGIES_TOKEN_SEARCH_RESULT {
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
}
// ========================================
// ========================================
// --- PAGE ------------------------------
// one page of tokens, plus whether more pages follow.
//
// the api refuses `limit` without a `sort`, so every page request
// carries one. the `default` sort is not a real field — it is the
// favourites-first view — so it pages by volume and the favourites
// are pinned on top afterwards.
export interface HUGGIES_DISCOVER_TOKEN_LIST {
  rows: HUGGIES_TOKEN_SEARCH_RESULT[];
  // true when the api has more rows behind this one.
  has_more: boolean;
  // how many rows the api has served, counting from the first page.
  // the caller pages on this, not on the length of `rows`.
  fetched: number;
}
// ========================================
// fetch one page of the token list, sorted by the chosen field.
//
// `offset` is the row count already served by the api, so page two
// asks for the rows after the first page.
async function fetch_token_list_fun(
  sort: HUGGIES_TOKEN_SORT,
  desc: boolean,
  offset: number,
  limit: number = HUGGIES_TOKEN_PAGE_SIZE,
): Promise<HUGGIES_DISCOVER_TOKEN_LIST> {
  const response = await api_intear_tokens_get({
    fields: HUGGIES_TOKEN_LIST_FIELDS,
    sort: {
      by: token_sort_field_fun(sort),
      desc,
    },
    limit,
    offset,
  });
  const rows = response.rows.map((row) =>
    map_token_row_fun(response.columns, row),
  );
  // the api reports the total number of indexed tokens. a page that
  // comes back short means the end has been reached; so does a
  // cumulative count that reaches the total.
  const total = response.total ?? null;
  const has_more =
    rows.length === limit && (total === null || offset + rows.length < total);
  return { rows, has_more, fetched: offset + rows.length };
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_DISCOVER_TOKEN_LIST = {
  fetch: fetch_token_list_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
