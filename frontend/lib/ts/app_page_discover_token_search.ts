// ========================================
// fuzzy token search with a sortable token list.
// ========================================
import {
  api_intear_tokens_get,
  api_intear_tokens_search,
} from "../../../middleman";
import { token_row_by_name_fun } from "./token_row_by_name";
import {
  HUGGIES_DEFAULT_TOKEN_SORT,
  token_sort_field_fun,
} from "./app_page_discover_token_sort";
// ========================================
export interface HUGGIES_TOKEN_SEARCH_RESULT {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  icon: string | null;
  price_usd: number;
  reputation: string;
  holders: number;
  volume_usd_24h: number;
  market_cap_usd: number;
}
// ========================================
// the fields the discover list needs. `icon` is NOT in this list: it is
// a full base64 data uri, and asking for it on every one of the
// indexed tokens costs ~21MB. icons are fetched separately, in small
// batches, and cached in the durable per-token store.
const HUGGIES_TOKEN_SEARCH_FIELDS = [
  "name",
  "symbol",
  "decimals",
  "price_usd",
  "reputation",
  "holders",
  "volume_usd_24h",
  "market_cap_usd",
] as const;
// the fields that identify a token, for the icon batch fetch.
export const HUGGIES_TOKEN_ICON_FIELDS = [
  "symbol",
  "decimals",
  "icon",
] as const;
// ========================================
// how many tokens one full fetch asks for. the indexed token count is
// around 7.4k, so this covers every token the api knows.
const HUGGIES_TOKEN_SET_LIMIT = 10000;
// ========================================
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
function map_token_search_row_fun(
  columns: ReadonlyArray<string>,
  row: readonly (string | number | null)[],
): HUGGIES_TOKEN_SEARCH_RESULT {
  const cell = token_row_by_name_fun(columns, row);
  const id = typeof cell.account_id === "string" ? cell.account_id : "";
  const name = cell.name;
  const symbol = cell.symbol;
  const icon = cell.icon;
  const reputation = cell.reputation;
  return {
    id,
    name: typeof name === "string" && name.length > 0 ? name : id,
    symbol: typeof symbol === "string" && symbol.length > 0 ? symbol : id,
    decimals: to_finite_number_fun(cell.decimals),
    icon: typeof icon === "string" && icon.length > 0 ? icon : null,
    price_usd: to_finite_number_fun(cell.price_usd),
    reputation: typeof reputation === "string" ? reputation : "Unknown",
    holders: to_finite_number_fun(cell.holders),
    volume_usd_24h: to_finite_number_fun(cell.volume_usd_24h),
    market_cap_usd: to_finite_number_fun(cell.market_cap_usd),
  };
}
// ========================================
// fetch EVERY indexed token in one call, without icons.
// --- WHY --- one call with a high limit, not a paginated walk: the
// api answers `total` alongside the rows, and the whole set without
// icons is ~720KB — one request, one cache write, and every sort and
// every ascending order then works over the complete list instead of
// over a truncated top-N.
export async function fetch_all_tokens_fun(): Promise<
  HUGGIES_TOKEN_SEARCH_RESULT[]
> {
  const response = await api_intear_tokens_get({
    fields: HUGGIES_TOKEN_SEARCH_FIELDS,
    // the api sorts by a real numeric field, never by our `default`
    // view key — that one is a javascript-side ordering, not a field.
    sort: { by: token_sort_field_fun(HUGGIES_DEFAULT_TOKEN_SORT), desc: true },
    limit: HUGGIES_TOKEN_SET_LIMIT,
  });
  return response.rows.map((row) =>
    map_token_search_row_fun(response.columns, row),
  );
}
// ========================================
// search the api for tokens matching a query.
// --- WHY --- the api has a real search index behind /tokens/search,
// matching symbol, name, account id and social links. filtering a
// downloaded list in javascript only ever sees the tokens we happened
// to download, so a token outside that set was unfindable no matter
// what the reader typed. this asks the api instead.
export async function search_tokens_fun(
  query: string,
  limit: number = 100,
): Promise<HUGGIES_TOKEN_SEARCH_RESULT[]> {
  const response = await api_intear_tokens_search({
    q: query,
    fields: HUGGIES_TOKEN_SEARCH_FIELDS,
    limit,
  });
  return response.rows.map((row) =>
    map_token_search_row_fun(response.columns, row),
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
