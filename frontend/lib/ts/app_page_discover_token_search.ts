// ========================================
// search the api for tokens matching a query.
//
// --- WHY --- the api has a real search index behind /tokens/search,
// matching symbol, name, account id and social links. filtering a
// downloaded list in javascript only ever sees the tokens we happened
// to download, so a token outside that set was unfindable no matter
// what the reader typed.
//
// --- WHY --- the search does not page. it asks for a bounded number
// of hits and shows them; a reader who wants more can type more.
import { api_intear_tokens_search } from "@sleet-js/middleman-intear-api";
import { token_row_by_name_fun } from "./token_row_by_name";
import type { HUGGIES_TOKEN_SEARCH_RESULT } from "./app_page_discover_token_result";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// `icon` is not among them — it is a full inline data uri, and the
// icons are fetched separately for the rows on screen.
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
// how many hits one search returns.
const HUGGIES_TOKEN_SEARCH_LIMIT = 100;
// ========================================
// ========================================
// --- HELPERS ----------------------------
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// --- WHY --- the row is read by column NAME, not by index: the api
// always returns `account_id` as the first column, even when it was
// not requested, so a fixed index read is shifted by one.
function map_token_search_row_fun(
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
// --- FETCH -----------------------------
export async function search_tokens_fun(
  query: string,
  limit: number = HUGGIES_TOKEN_SEARCH_LIMIT,
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
