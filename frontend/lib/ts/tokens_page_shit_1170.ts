// ========================================
// the $SHIT page's ONE load: every fetch the page makes happens here.
//
// read this file to know what the $SHIT page requests. that is the
// whole point of it.
//
// WHAT THE PAGE REQUESTS
//   1. GET /tokens     the token's summary: decimals, total supply, the
//                      main pool, and the metadata the page shows.
//   2. GET /price      the token's price from the intear price api, and
//                      the ref finance pool it is priced against.
//   3. near view       the ref finance pool, for the LP reference.
//   4. GET /holders    one page of the token's holders, 100 rows at a
//                      time, paged by cursor.
//
// --- WHY --- the summary loads FIRST and alone. it carries the token's
// decimals, its total supply and its main pool, and the price reference
// and the holder rows both need them. nothing about the token is
// hardcoded, so the holder math cannot start before the api has
// answered.
//
// --- WHY --- the holders wait for the price. the holder rows carry a
// usd column, and a row priced with a price of zero reads as "$0.00",
// which is a lie rather than a missing number. so the price is known
// before the first holder page is asked for.
import { HUGGIES_SHIT_TOKEN_ID } from "./shit_token";
import { fetch_shit_summary_fun } from "./tokens_page_shit_1170_summary";
import { fetch_shit_price_ref_fun } from "./tokens_page_shit_1170_price_ref";
import { fetch_shit_holders_fun } from "./tokens_page_shit_1170_holders";
import type { HUGGIES_SHIT_SUMMARY } from "./tokens_page_shit_1170_summary";
import type { HUGGIES_SHIT_PRICE_REF } from "./tokens_page_shit_1170_price_ref";
import type {
  HUGGIES_SHIT_HOLDER,
  HUGGIES_SHIT_HOLDERS_PAGE,
} from "./tokens_page_shit_1170_holders";
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
// fetch the token's summary: its decimals, its total supply, its main
// pool and the metadata the page shows.
async function fetch_shit_summary_page_fun(): Promise<HUGGIES_SHIT_SUMMARY | null> {
  return await fetch_shit_summary_fun();
}
// ========================================
// --- PRICE REF -------------------------
// fetch the token's price and the LP-pool reference it is priced
// against.
async function fetch_shit_price_ref_page_fun(
  summary: HUGGIES_SHIT_SUMMARY | null,
): Promise<HUGGIES_SHIT_PRICE_REF> {
  return await fetch_shit_price_ref_fun(
    summary?.main_pool ?? null,
    summary?.decimals ?? 18,
  );
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
export const HUGGIES_TOKENS_PAGE_SHIT_1170 = {
  token_id: HUGGIES_SHIT_TOKEN_ID,
  load_summary: fetch_shit_summary_page_fun,
  load_price_ref: fetch_shit_price_ref_page_fun,
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
