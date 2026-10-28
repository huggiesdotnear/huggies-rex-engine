// ========================================
// the token page's ONE load: every fetch the page makes happens here.
//
// read this file to know what the token page requests. that is the
// whole point of it.
//
// WHAT THE PAGE REQUESTS
//   1. GET /tokens    the token's metadata: name, symbol, decimals,
//                     icon, price, reputation, holders, liquidity,
//                     market cap, socials, description.
//   2. GET /holders   one page of the indexed holders of the token,
//                     100 rows at a time, paged by cursor.
//
// --- WHY --- the price and the decimals come from the metadata
// request rather than from a second call. the holders table prices
// each balance with the token's price and scales it by the token's
// decimals, and the metadata response already carries both — so a
// separate read-through call for the same token would fetch the same
// numbers twice over the wire.
//
// --- WHY --- the metadata request asks for `icon_hash`, not `icon`.
// the `icon` field is a full inline data uri and makes up almost the
// whole payload; the hash is 16 characters and the icon itself is
// served from a content-addressed url the browser caches for a year.
// see lib/ts/token_icon_url.ts.
// ========================================
import {
  api_intear_holders_get,
  api_intear_tokens_get,
} from "../../../middleman";
import { token_row_by_name_fun } from "./token_row_by_name";
import { icon_hash_of_fun, token_icon_for_fun } from "./token_icon_url";
import type {
  HUGGIES_TOKEN_DETAIL,
  HUGGIES_TOKEN_HOLDERS_PAGE,
} from "./token_page_token_detail";
// ========================================
// the fields the metadata request asks for.
//
// --- WHY --- no `main_pool` / `main_pool_url`: they were fetched and
// never rendered. a field nobody reads is payload for nothing.
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
] as const;
// ========================================
// how many holder rows one request asks for.
const HUGGIES_TOKEN_HOLDERS_LIMIT = 100;
// ========================================
// --- HELPERS ----------------------------
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// --- METADATA --------------------------
// fetch one token's complete metadata record.
//
// --- WHY --- the row is read by column NAME, not by index: the api
// always returns `account_id` as the first column, even when it was
// not requested, so a fixed index read is shifted by one — which put
// the token id in the name slot and the icon data uri in the price
// slot, so the icon never rendered.
async function fetch_token_detail_fun(
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
  return {
    id: token_id,
    name: typeof name === "string" && name.length > 0 ? name : token_id,
    symbol: typeof symbol === "string" && symbol.length > 0 ? symbol : token_id,
    decimals: to_finite_number_fun(cell.decimals),
    icon: token_icon_for_fun(token_id, icon_hash_of_fun(icon_hash)),
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
  };
}
// ========================================
// --- HOLDERS ---------------------------
// fetch one cursor page of indexed holders.
async function fetch_token_holders_fun(
  token_id: string,
  cursor: string | null,
): Promise<HUGGIES_TOKEN_HOLDERS_PAGE> {
  const response = await api_intear_holders_get({
    token: token_id,
    limit: HUGGIES_TOKEN_HOLDERS_LIMIT,
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
// --- PUBLIC ---------------------------
// the page's load surface. one call per thing the page loads.
export const HUGGIES_TOKEN_PAGE_TOKEN = {
  load_detail: fetch_token_detail_fun,
  load_holders: fetch_token_holders_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
