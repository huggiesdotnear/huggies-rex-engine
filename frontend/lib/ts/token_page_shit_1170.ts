// ========================================
// the $SHIT page's ONE load: every fetch the page makes happens here.
//
// WHAT THE PAGE REQUESTS
//   1. GET /tokens     the token's summary: the price, the decimals,
//                      the total supply, and the metadata the page
//                      shows.
//   2. GET /holders    one page of the token's holders, 100 rows at a
//                      time, paged by cursor.
//
// --- WHY --- the summary loads FIRST and alone. it carries the price,
// the decimals and the total supply, and the holder rows need all
// three. a row priced with a price of zero reads as "$0.00" — a lie
// rather than a missing number. nothing about the token is hardcoded,
// so the holder math cannot start before the api has answered.
//
// --- WHY --- there is no separate price request: the summary asks for
// `price_usd` and gets it, so asking again would fetch the same number
// twice over the wire.
import { HUGGIES_SHIT_TOKEN_ID } from "./token_page_shit_1170_token";
import { fetch_shit_summary_fun } from "./token_page_shit_1170_summary";
import { fetch_shit_holders_fun } from "./token_page_shit_1170_holders";
import type { HUGGIES_SHIT_SUMMARY } from "./token_page_shit_1170_summary";
import type {
  HUGGIES_SHIT_HOLDER,
  HUGGIES_SHIT_HOLDERS_PAGE,
} from "./token_page_shit_1170_holders";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// read the api's total supply as a bigint, so the percent math stays
// exact. a malformed value reads as zero, which makes every percent
// zero rather than NaN.
//
// --- WHY --- the supply carries 18 decimals, so it does not fit in a
// double without losing digits.
function bigint_or_zero_fun(value: string): bigint {
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}
// ========================================
// --- SUMMARY ---------------------------
// fetch the token's summary: its decimals, its total supply and the
// metadata the page shows.
async function fetch_shit_summary_page_fun(): Promise<HUGGIES_SHIT_SUMMARY | null> {
  return await fetch_shit_summary_fun();
}
// ========================================
// --- HOLDERS ---------------------------
// fetch one cursor page of the token's holders, priced and classified.
async function fetch_shit_holders_page_fun(
  cursor: string | null,
  price_usd: number,
  decimals: number,
  total_supply_raw: bigint,
): Promise<HUGGIES_SHIT_HOLDERS_PAGE> {
  return await fetch_shit_holders_fun(
    cursor,
    price_usd,
    decimals,
    total_supply_raw,
  );
}
// ========================================
// --- PUBLIC ---------------------------
// the page's load surface. one call per thing the page loads.
export const HUGGIES_TOKEN_PAGE_SHIT_1170 = {
  token_id: HUGGIES_SHIT_TOKEN_ID,
  load_summary: fetch_shit_summary_page_fun,
  load_holders: fetch_shit_holders_page_fun,
  bigint_or_zero: bigint_or_zero_fun,
};
// ========================================
// the shape of the loaded holder rows, re-exported so the components
// that read them do not have to reach into the holders module.
export type { HUGGIES_SHIT_HOLDER };
// ========================================
// copyright 2026 by sleet.near
// ========================================
