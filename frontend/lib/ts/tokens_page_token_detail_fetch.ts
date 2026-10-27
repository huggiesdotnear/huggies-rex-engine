// ========================================
// fetch complete token metadata and one indexed-holder page.
// ========================================
import {
  api_intear_holders_get,
  api_intear_tokens_get,
} from "../../../middleman";
import { token_row_by_name_fun } from "./token_row_by_name";
import { icon_hash_of_fun, token_icon_url_fun } from "./token_icon_url";
import type {
  HUGGIES_TOKEN_DETAIL,
  HUGGIES_TOKEN_HOLDERS_PAGE,
} from "./tokens_page_token_detail";
// ========================================
const HUGGIES_TOKEN_DETAIL_FIELDS = [
  "name",
  "symbol",
  "decimals",
  "icon_hash",
  "price_usd",
  "reputation",
  "holders",
  "liquidity_usd",
  "market_cap_usd",
  "socials",
  "description",
  "main_pool",
  "main_pool_url",
] as const;
// ========================================
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// fetch one token's complete metadata record.
// --- WHY --- the row is read by column NAME, not by index: the api
// always returns `account_id` as the first column, even when it was
// not requested, so a fixed index read is shifted by one — which put
// the token id in the name slot and the icon data uri in the price
// slot, so the icon never rendered.
export async function fetch_token_detail_fun(
  token_id: string,
): Promise<HUGGIES_TOKEN_DETAIL | null> {
  const response = await api_intear_tokens_get({
    ids: [token_id],
    fields: HUGGIES_TOKEN_DETAIL_FIELDS,
  });
  const row = response.rows[0];
  if (row === undefined) return null;
  const cell = token_row_by_name_fun(response.columns, row);
  const name = cell.name;
  const symbol = cell.symbol;
  const icon_hash = cell.icon_hash;
  const socials = cell.socials;
  const description = cell.description;
  const main_pool = cell.main_pool;
  const main_pool_url = cell.main_pool_url;
  return {
    id: token_id,
    name: typeof name === "string" && name.length > 0 ? name : token_id,
    symbol: typeof symbol === "string" && symbol.length > 0 ? symbol : token_id,
    decimals: to_finite_number_fun(cell.decimals),
    icon: token_icon_url_fun(icon_hash_of_fun(icon_hash)),
    price_usd: to_finite_number_fun(cell.price_usd),
    reputation:
      typeof cell.reputation === "string" ? cell.reputation : "Unknown",
    holders: to_finite_number_fun(cell.holders),
    liquidity_usd: to_finite_number_fun(cell.liquidity_usd),
    market_cap_usd: to_finite_number_fun(cell.market_cap_usd),
    socials:
      socials !== null && typeof socials === "object"
        ? (socials as Record<string, string>)
        : {},
    description: typeof description === "string" ? description : null,
    main_pool: typeof main_pool === "string" ? main_pool : null,
    main_pool_url: typeof main_pool_url === "string" ? main_pool_url : null,
  };
}
// ========================================
// fetch one cursor page of indexed holders, capped at 100 rows.
export async function fetch_token_holders_fun(
  token_id: string,
  cursor: string | null,
): Promise<HUGGIES_TOKEN_HOLDERS_PAGE> {
  const response = await api_intear_holders_get({
    token: token_id,
    limit: 100,
    cursor: cursor ?? undefined,
  });
  return {
    rows: response.rows.map((row) => ({
      account_id: row[0],
      balance: row[1],
    })),
    total: response.total,
    next_cursor: response.next_cursor,
  };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
