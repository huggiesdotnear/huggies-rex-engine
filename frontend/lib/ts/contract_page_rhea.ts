// ========================================
// the rhea page's ONE load: every fetch the page makes happens here.
//
// WHAT THE PAGE REQUESTS
//   1. GET /pool/search   the pools, sorted and paged by the api.
//   2. GET /pool/search   the same pools again, when the reader picks
//      a different sort, direction or pool family.
//   3. GET /all-pool-data the dex's own tvl and 24h volume, for the
//      header.
//
// WHY ONE ENDPOINT FOR THE POOLS
// --- /pool/search is the only rhea endpoint that answers with a total, a
// sort and a page of rows in one go. /list-pools has no total and no apy,
// so the page count would be a guess. /fetchAllPools answers with every
// pool at once — thousands of rows, megabytes of json, and no volume or
// apy at all.
//
// WHY THE HEADER'S NUMBERS ARE NOT THE SUM OF THE ROWS
// --- the rows on screen are one page of one sort. adding them up gives
// the tvl of THAT page, not of the dex. /all-pool-data is the api's own
// total over every pool it indexes, so it is the number the header shows.
//
// WHY THE POOL TYPE IS A FILTER, NOT A SEPARATE PAGE
// --- the api's `type` narrows one request to one pool family:
//   `all`     - every pool, classic and dcl
//   `classic` - the ref finance v2 amm pools
//   `dcl`     - the ref labs dcl v2 pools
// the page keeps all three on one request so the reader can switch between
// the two rhea contracts without leaving the list.
//
// WHY THE ROW SHOWS THE API'S `Type` AND NOT ITS `pool_kind`
// --- the api sends two names for every pool. `pool_kind` is the SHAPE of
// the pool (DCL, SIMPLE_POOL, RATED_SWAP, STABLE_SWAP, DEGEN_SWAP) and
// `Type` is the FAMILY it belongs to (classic, dcl, stable, degen). the
// shape names are the api's internals and mean nothing to a reader; the
// family names are exactly the two contracts this page is about, so the
// row shows the family and keeps the classic/dcl split visible.
//
// WHY THE SEARCH IS THE API'S, NOT OURS
// --- the api takes a `token_list` filter and matches it against the token
// symbols and the token account ids, so a reader who types "wNEAR" finds
// every pool that holds it. filtering the loaded page in javascript would
// only find the pools that happened to be on the page, which is a pool out
// of ten thousand.
// ========================================
import {
  api_rhea_all_pool_data,
  api_rhea_pool_search,
} from "@sleet-js/middleman-rhea-api";
import type {
  RHEA_POOL_SEARCH_ITEM,
  RHEA_POOL_SEARCH_TYPE,
} from "@sleet-js/middleman-rhea-api";
import { HUGGIES_POOL_TOKENS } from "./pool_tokens";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how many pools one page holds. the list scrolls, so this is how many
// rows are on screen at once.
const HUGGIES_RHEA_POOL_PAGE_SIZE = 50;
// the pool families the reader can pick between.
const HUGGIES_RHEA_POOL_TYPES: ReadonlyArray<RHEA_POOL_SEARCH_TYPE> = [
  "all",
  "classic",
  "dcl",
];
// ========================================
// ========================================
// --- TYPES ------------------------------
// one pool as the page shows it.
export interface HUGGIES_RHEA_POOL {
  // the pool's own id. it is a string: a classic pool is numbered and a
  // dcl pool is named after its two tokens and its fee.
  id: string;
  // the api's own pool kind: DCL, SIMPLE_POOL, RATED_SWAP, STABLE_SWAP
  // or DEGEN_SWAP. kept for the fallback label, never shown raw.
  kind: string;
  // the api's own pool TYPE, as it sends it: classic, dcl, stable or
  // degen. this is the readable one and the one the row shows.
  //
  // --- WHY --- `Type` is the family of the pool and not the shape of
  // it. `pool_kind` is the shape (SIMPLE_POOL, RATED_SWAP, DCL, ...), and
  // those names are the api's internals. `Type` is the family a reader
  // can act on: classic is the ref finance v2 amm, dcl is the ref labs
  // dcl v2 — the two contracts this page is about — and stable and degen
  // are the other two families rhea runs. so `Type` is what the row
  // shows, and the classic/dcl split stays visible.
  type: string;
  // the pool's token symbols, e.g. ["USDC", "wNEAR"].
  symbols: ReadonlyArray<string>;
  // the token account ids behind those symbols.
  token_ids: ReadonlyArray<string>;
  // the icons of those tokens, in the same order as `token_ids`. a null
  // is a token with no icon.
  icons: ReadonlyArray<string | null>;
  tvl_usd: number;
  volume_24h_usd: number;
  // the pool's apy, as a percentage.
  apy: number;
  // the pool's fee, as a fraction of the swap (0.003 = 0.3%).
  fee: number;
  is_farm: boolean;
  is_meme: boolean;
  // true when the pool's tokens are not certified by rhea.
  is_uncertified: boolean;
}
// ========================================
// everything the rhea page has loaded.
export interface HUGGIES_RHEA_PAGE_DATA {
  pools: ReadonlyArray<HUGGIES_RHEA_POOL>;
  // how many pools the api matched for the CURRENT view — the family and
  // the search together. this is the count the list pages on.
  total: number;
  // how many pools the dex has in the chosen family, with no search.
  // this is the count the header shows.
  pool_count: number;
  // true when the api has more pools behind this one.
  has_more: boolean;
  tvl_usd: number;
  volume_24h_usd: number;
  errors: ReadonlyArray<string>;
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// parse a numeric API value without rendering NaN or Infinity.
//
// --- WHY --- rhea answers every number as a decimal STRING, and a pool
// with no tvl answers with a negative sliver rather than a zero. a negative
// tvl is real data (a dcl pool that emptied out), so it is kept as it is.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// map one api pool row into the display record.
function map_pool_fun(pool: RHEA_POOL_SEARCH_ITEM): HUGGIES_RHEA_POOL {
  return {
    id: String(pool.id),
    kind: pool.pool_kind,
    // --- WHY --- the api sends `Type` on every pool row, but it is a
    // plain string and nothing stops an older row from leaving it out.
    // an empty type falls back to the pool kind, so the row always has
    // something to say.
    type: typeof pool.Type === "string" ? pool.Type : "",
    symbols: Array.isArray(pool.token_symbols) ? pool.token_symbols : [],
    token_ids: Array.isArray(pool.token_account_ids)
      ? pool.token_account_ids
      : [],
    icons: [],
    tvl_usd: to_finite_number_fun(pool.tvl),
    volume_24h_usd: to_finite_number_fun(pool.volume_24h),
    apy: to_finite_number_fun(pool.apy),
    fee: to_finite_number_fun(pool.total_fee),
    is_farm: pool.is_farm === true,
    is_meme: pool.is_meme === true,
    is_uncertified:
      Array.isArray(pool.uncertified_tokens) &&
      pool.uncertified_tokens.length > 0,
  };
}
// ========================================
// ========================================
// --- TOTALS ----------------------------
// the dex's own tvl and 24h volume, over every pool the indexer knows.
//
// --- WHY --- this is a separate request and not the sum of the rows on
// screen: the rows are one page of one sort, so their sum is the tvl of THAT
// page. the header wants the size of the whole dex.
//
// --- WHY --- a failure here does not take the pools down: the pools are the
// page, the two numbers are the headline. so it is caught on its own and the
// header falls back to zeros.
async function fetch_totals_fun(): Promise<{
  tvl_usd: number;
  volume_24h_usd: number;
  error: string | null;
}> {
  try {
    const response = await api_rhea_all_pool_data();
    const data = response.data;
    return {
      tvl_usd: to_finite_number_fun(data?.tvl),
      volume_24h_usd: to_finite_number_fun(data?.volume_24h),
      error: null,
    };
  } catch (err) {
    return {
      tvl_usd: 0,
      volume_24h_usd: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
// ========================================
// the number of pools in the dex's chosen family, with no search.
//
// --- WHY --- a request of its own and not the count from the list: the
// api's `total` follows the search filter, so a search for "NEARLY" would
// make the header say the dex has 3,982 pools when it has 10,017. the
// header's tiles are the size of the DEX, so the count has to come from an
// unfiltered request.
//
// --- WHY --- the family still counts: the reader picked AMM, so the
// number of AMM pools is the number they want.
async function fetch_family_count_fun(
  type: RHEA_POOL_SEARCH_TYPE,
): Promise<{ count: number; error: string | null }> {
  try {
    const response = await api_rhea_pool_search({
      type,
      sort: "tvl",
      order_by: "desc",
      limit: 1,
      offset: 0,
    });
    return { count: response.data?.total ?? 0, error: null };
  } catch (err) {
    return {
      count: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// fetch one page of pools for a sort, a direction and a pool family,
// plus the dex's own totals.
//
// --- WHY --- the api does the sorting and the paging, so the page never
// downloads the whole list.
//
// --- WHY --- `order_by` carries the direction and not the sort: the api
// takes the FIELD in `sort` (tvl | 24h | apy) and the DIRECTION in `order_by`
// (asc | desc). a `sort` of `volume_24h` is rejected by the api — the field
// is called `24h` — and `order_by=desc` needs a `sort` beside it or the api
// answers "sort error".
//
// --- WHY --- the search goes in the url and not in javascript: the api
// matches the token symbols and the token account ids, so a reader who types
// "wNEAR" finds every pool holding it, not only the ones on the page that
// happened to be loaded.
//
// --- WHY --- the three requests run together: they are three different
// endpoints, so the page is as slow as its slowest one.
async function load_pools_fun(
  sort: string,
  desc: boolean,
  type: RHEA_POOL_SEARCH_TYPE,
  offset: number,
  search: string,
): Promise<HUGGIES_RHEA_PAGE_DATA> {
  const needle = search.trim();
  const [rows_result, totals, family] = await Promise.all([
    api_rhea_pool_search({
      type,
      sort,
      order_by: desc ? "desc" : "asc",
      limit: HUGGIES_RHEA_POOL_PAGE_SIZE,
      offset,
      ...(needle.length > 0 ? { token_list: needle } : {}),
    }),
    fetch_totals_fun(),
    fetch_family_count_fun(type),
  ]);

  const data = rows_result.data;
  const rows = data?.list ?? [];
  const total = data?.total ?? 0;
  const pools = rows.map((pool) => map_pool_fun(pool));
  const errors: string[] = [];
  if (totals.error !== null) errors.push(`totals: ${totals.error}`);
  if (family.error !== null) errors.push(`count: ${family.error}`);

  // --- WHY --- the icons come last: one request covers the whole list, so
  // asking for them first would only delay the pools.
  //
  // --- WHY --- the intear api and not rhea's own /list-token: rhea's pool
  // rows carry the token ACCOUNT IDS — wrap.near, token.rhealab.near — which
  // are the same ids the intear token indexer knows. so both dex pages ask the
  // SAME api for their icons, and the app's durable token cache holds them
  // for both.
  const token_ids = pools.flatMap((pool) => pool.token_ids);
  const tokens = await HUGGIES_POOL_TOKENS.fetch(token_ids);
  for (const pool of pools) {
    pool.icons = pool.token_ids.map((id) => tokens.get(id)?.icon ?? null);
  }

  return {
    pools,
    total,
    has_more: offset + pools.length < total,
    tvl_usd: totals.tvl_usd,
    volume_24h_usd: totals.volume_24h_usd,
    pool_count: family.count,
    errors,
  };
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_CONTRACT_PAGE_RHEA = {
  load: load_pools_fun,
  pool_types: HUGGIES_RHEA_POOL_TYPES,
};
// ========================================
// copyright 2026 by sleet.near
