// ========================================
// token summary fetch for the dedicated SHIT page.
// ========================================
import { api_intear_tokens_get } from "../../../middleman";
import { HUGGIES_SHIT_TOKEN_ID } from "./shit_config";
// ========================================
// the metadata fields the summary shows.
const HUGGIES_SHIT_SUMMARY_FIELDS = [
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
// the token summary shown at the top of the page.
export interface HUGGIES_SHIT_SUMMARY {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  icon: string | null;
  price_usd: number;
  reputation: string;
  holders: number;
  liquidity_usd: number;
  market_cap_usd: number;
  socials: Record<string, string>;
  description: string | null;
  main_pool: string | null;
  main_pool_url: string | null;
}
// ========================================
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// fetch the SHIT token summary from the intear api.
export async function fetch_shit_summary_fun(): Promise<HUGGIES_SHIT_SUMMARY | null> {
  const response = await api_intear_tokens_get({
    ids: [HUGGIES_SHIT_TOKEN_ID],
    fields: HUGGIES_SHIT_SUMMARY_FIELDS,
  });
  const row = response.rows[0];
  if (row === undefined) return null;
  // --- WHY --- the intear /tokens row always starts with the token's
  // account id, even though it is not one of the requested fields
  // (the row type is `readonly [string, ...fields]`). skipping it
  // keeps every field below lined up with its own name.
  const [
    ,
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
    id: HUGGIES_SHIT_TOKEN_ID,
    name: typeof name === "string" ? name : HUGGIES_SHIT_TOKEN_ID,
    symbol: typeof symbol === "string" ? symbol : HUGGIES_SHIT_TOKEN_ID,
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
// copyright 2026 by sleet.near
// ========================================
