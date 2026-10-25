// ========================================
// fetch complete token metadata and one indexed-holder page.
// ========================================
import {
  api_intear_holders_get,
  api_intear_tokens_get,
} from "../../../middleman";
import type {
  HUGGIES_TOKEN_DETAIL,
  HUGGIES_TOKEN_HOLDERS_PAGE,
} from "./token_detail";
// ========================================
const HUGGIES_TOKEN_DETAIL_FIELDS = [
  "name",
  "symbol",
  "decimals",
  "icon",
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
export async function fetch_token_detail_fun(
  token_id: string,
): Promise<HUGGIES_TOKEN_DETAIL | null> {
  const response = await api_intear_tokens_get({
    ids: [token_id],
    fields: HUGGIES_TOKEN_DETAIL_FIELDS,
  });
  const row = response.rows[0];
  if (row === undefined) return null;
  const [
    name,
    symbol,
    decimals,
    icon,
    price_usd,
    reputation,
    holders,
    liquidity_usd,
    market_cap_usd,
    socials,
    description,
    main_pool,
    main_pool_url,
  ] = row;
  return {
    id: token_id,
    name: typeof name === "string" ? name : token_id,
    symbol: typeof symbol === "string" ? symbol : token_id,
    decimals: to_finite_number_fun(decimals),
    icon: typeof icon === "string" ? icon : null,
    price_usd: to_finite_number_fun(price_usd),
    reputation: typeof reputation === "string" ? reputation : "Unknown",
    holders: to_finite_number_fun(holders),
    liquidity_usd: to_finite_number_fun(liquidity_usd),
    market_cap_usd: to_finite_number_fun(market_cap_usd),
    socials: socials !== null && typeof socials === "object" ? socials : {},
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
