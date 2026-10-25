// ========================================
// fuzzy token search with a stable ordered initial token list.
// ========================================
import {
  api_intear_tokens_get,
  api_intear_tokens_search,
} from "../../../middleman";
import { token_row_by_name_fun } from "./token_row_by_name";
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
}
const HUGGIES_TOKEN_SEARCH_FIELDS = [
  "name",
  "symbol",
  "decimals",
  "icon",
  "price_usd",
  "reputation",
  "holders",
] as const;
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
// the price, which is not a string) and every symbol fall back to the
// token id.
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
  };
}
// ========================================
// fetch the initial ordered token list.
export async function fetch_initial_tokens_fun(): Promise<
  HUGGIES_TOKEN_SEARCH_RESULT[]
> {
  const response = await api_intear_tokens_get({
    fields: HUGGIES_TOKEN_SEARCH_FIELDS,
    sort: { by: "market_cap_usd", desc: true },
    limit: 100,
  });
  return response.rows.map((row) =>
    map_token_search_row_fun(response.columns, row),
  );
}
// ========================================
// fetch fuzzy token search results for a query.
export async function search_tokens_fun(
  query: string,
): Promise<HUGGIES_TOKEN_SEARCH_RESULT[]> {
  const response = await api_intear_tokens_search({
    q: query,
    fields: HUGGIES_TOKEN_SEARCH_FIELDS,
    limit: 100,
  });
  return response.rows.map((row) =>
    map_token_search_row_fun(response.columns, row),
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
