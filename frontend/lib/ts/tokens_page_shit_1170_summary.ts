// ========================================
// token summary fetch for the dedicated SHIT page.
// ========================================
import { api_intear_tokens_get } from "../../../middleman";
import { HUGGIES_SHIT_TOKEN_ID } from "./shit_token";
// ========================================
// the metadata fields the summary shows.
//
// only the fields the page actually renders are requested — the icon,
// the socials, the description and the main pool links are not shown
// on the $SHIT page, so asking for them only makes the response
// bigger.
const HUGGIES_SHIT_SUMMARY_FIELDS = [
  "name",
  "symbol",
  "decimals",
  "price_usd",
  "reputation",
  "holders",
  "liquidity_usd",
  "market_cap_usd",
  "total_supply",
  "total_supply_with_decimals",
  "main_pool",
] as const;
// ========================================
// the token summary shown at the top of the page.
export interface HUGGIES_SHIT_SUMMARY {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  price_usd: number;
  reputation: string;
  holders: number;
  liquidity_usd: number;
  market_cap_usd: number;
  // the total supply, in the token's smallest unit, as the raw
  // decimal string the api reports. the percent math runs on this.
  total_supply_raw: string;
  // the total supply, human readable.
  total_supply: string;
  // the ref finance pool the token is priced against, e.g. "REF-5767".
  main_pool: string | null;
}
// ========================================
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed =
    typeof value === "number" ? Number(value) : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// read a decimal string the api reports, keeping it as a string so the
// big-integer math downstream stays exact.
// --- WHY --- the supply does not fit in a double once it carries 18
// decimals, and the percent math needs every digit.
function to_decimal_string_fun(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
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
    price_usd,
    reputation,
    holders,
    liquidity_usd,
    market_cap_usd,
    total_supply,
    total_supply_with_decimals,
    main_pool,
  ] = row;
  return {
    id: HUGGIES_SHIT_TOKEN_ID,
    name: typeof name === "string" ? name : HUGGIES_SHIT_TOKEN_ID,
    symbol: typeof symbol === "string" ? symbol : HUGGIES_SHIT_TOKEN_ID,
    decimals: to_finite_number_fun(decimals),
    price_usd: to_finite_number_fun(price_usd),
    reputation: typeof reputation === "string" ? reputation : "Unknown",
    holders: to_finite_number_fun(holders),
    liquidity_usd: to_finite_number_fun(liquidity_usd),
    market_cap_usd: to_finite_number_fun(market_cap_usd),
    total_supply_raw: to_decimal_string_fun(total_supply, "0"),
    total_supply: to_decimal_string_fun(total_supply_with_decimals, "0"),
    main_pool: typeof main_pool === "string" ? main_pool : null,
  };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
