// ========================================
// the intear dex page's ONE load: every fetch the page makes happens
// here.
//
// read this file to know what the intear dex page requests. that is
// the whole point of it.
//
// WHAT THE PAGE REQUESTS
//   1. GET /pools/all          every pool, with its liquidity, its
//                              24h and 7d volume and its apy.
//   2. GET /stats/tvl/total    the tvl series, for the header's tvl.
//   3. GET /stats/volume/total the volume series, for the header's
//                              24h volume.
//
// WHY THE STATS ARE SEPARATE REQUESTS
// --- /pools/all carries the liquidity and the volume of every pool,
// so the page could add them up. but the series endpoints are the
// api's OWN totals: they count the volume of every swap the dex did,
// including the ones in a pool that has since been closed. summing
// the pools on screen would quietly under-report the dex.
//
// WHY THERE IS NO PAGING
// --- the dex api answers /pools/all with every pool in one go — 303
// of them at the time of writing — and it has no paging and no sort.
// the list scrolls, so a page of 300 rows is a fine page. the sort is
// ours, done in javascript over the rows the api already sent.
//
// WHY THE SYMBOLS COME FROM ELSEWHERE
// --- the dex api names its assets by id only: `nep141:token.x.near`.
// the symbols live in the intear token indexer, which is a different
// api. asking it for the symbols of the tokens on screen is one
// request, and it rides along with the pools.
// ========================================
import {
  api_intear_dex_pools_all,
  api_intear_dex_stats_tvl_total,
  api_intear_dex_stats_volume_total,
} from "@sleet-js/middleman-intear-dex-api";
import type {
  INTEAR_DEX_POOL,
  INTEAR_DEX_POOL_BODY,
} from "@sleet-js/middleman-intear-dex-api";
import { HUGGIES_POOL_TOKENS } from "./pool_tokens";
// ========================================
// ========================================
// --- TYPES ------------------------------
// one pool as the page shows it.
export interface HUGGIES_INTEAR_DEX_POOL {
  // the pool's own id, as a number.
  id: number;
  // the kind of pool: Public, Private, Launch or LaunchV2.
  kind: string;
  // the token ids in the pool, in the api's own order.
  token_ids: ReadonlyArray<string>;
  // the token symbols, when the token indexer knows them.
  symbols: ReadonlyArray<string>;
  // the icons of those tokens, in the same order as `token_ids`. a null
  // is a token with no icon.
  icons: ReadonlyArray<string | null>;
  // the value locked in the pool, in usd.
  tvl_usd: number;
  // the 24 hour volume, in usd.
  volume_24h_usd: number;
  // the 7 day volume, in usd.
  volume_7d_usd: number;
  // the pool's apy, as a percentage.
  apy: number;
  // the pool's owner, when it has one (a private pool).
  owner_id: string | null;
}
// ========================================
// everything the intear dex page has loaded.
export interface HUGGIES_INTEAR_DEX_PAGE_DATA {
  // the pools on screen.
  pools: ReadonlyArray<HUGGIES_INTEAR_DEX_POOL>;
  // the dex's total value locked, in usd.
  tvl_usd: number;
  // the dex's volume over the last 24 hours, in usd.
  volume_24h_usd: number;
  // one message per thing that failed.
  errors: ReadonlyArray<string>;
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// parse a numeric API value without rendering NaN or Infinity.
//
// --- WHY --- the dex api answers the liquidity as a decimal STRING
// with a lot of digits, and the volumes as plain numbers.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// turn an asset id into the token id the token indexer knows.
//
// --- WHY --- the dex names its assets `nep141:token.x.near` and
// `near`, and the token indexer knows `token.x.near` and `near`. the
// prefix carries no meaning for us, so it is dropped.
function asset_to_token_id_fun(asset_id: string): string {
  if (asset_id === "near") return "near";
  if (asset_id.startsWith("nep141:")) return asset_id.slice("nep141:".length);
  return asset_id;
}
// ========================================
// read the tokens out of one pool body, whatever kind it is.
//
// --- WHY --- the pool body is a serde enum: exactly one of Public,
// Private, Launch or LaunchV2 is present, and each names its tokens
// differently. this reads all four so the page never has to care
// which kind a pool is.
function pool_tokens_fun(body: INTEAR_DEX_POOL_BODY): {
  token_ids: string[];
  owner_id: string | null;
} {
  if ("Public" in body) {
    return {
      token_ids: body.Public.assets.map((asset) =>
        asset_to_token_id_fun(asset.asset_id),
      ),
      owner_id: null,
    };
  }
  if ("Private" in body) {
    return {
      token_ids: body.Private.assets.map((asset) =>
        asset_to_token_id_fun(asset.asset_id),
      ),
      owner_id: body.Private.owner_id,
    };
  }
  if ("Launch" in body) {
    return {
      token_ids: [
        "near",
        asset_to_token_id_fun(body.Launch.launched_asset.asset_id),
      ],
      owner_id: null,
    };
  }
  return {
    token_ids: [
      asset_to_token_id_fun(body.LaunchV2.quote_asset.asset_id),
      asset_to_token_id_fun(body.LaunchV2.launched_asset.asset_id),
    ],
    owner_id: null,
  };
}
// ========================================
// map one api pool row into the display record.
function map_pool_fun(pool: INTEAR_DEX_POOL): HUGGIES_INTEAR_DEX_POOL {
  const kind = Object.keys(pool.pool)[0] ?? "Public";
  const tokens = pool_tokens_fun(pool.pool);
  return {
    id: pool.id,
    kind,
    token_ids: tokens.token_ids,
    symbols: [],
    icons: [],
    tvl_usd: to_finite_number_fun(pool.liquidity_usd),
    volume_24h_usd: to_finite_number_fun(pool.volume_24h_usd),
    volume_7d_usd: to_finite_number_fun(pool.volume_7d_usd),
    apy: to_finite_number_fun(pool.apy),
    owner_id: tokens.owner_id,
  };
}
// ========================================
// ========================================
// --- STATS -----------------------------
// the dex's total tvl, from the tvl series.
//
// --- WHY --- the last point of the series and not the sum of it: the
// series is a daily SNAPSHOT of the tvl - one point per day - so the
// last point IS today's tvl. summing it would add every day together,
// which is not a number that means anything.
async function fetch_tvl_fun(): Promise<number> {
  const series = await api_intear_dex_stats_tvl_total("total");
  const last = series[series.length - 1];
  return last === undefined ? 0 : to_finite_number_fun(last.tvl_usd);
}
// ========================================
// the dex's volume over the last 24 hours, from the volume series.
//
// --- WHY --- the day series and not the total: the total series runs
// from the dex's first day, so it is the volume of all time, not of
// the last day.
//
// --- WHY --- the points are SUMMED and not read as the last one: the
// `day` period is an HOURLY series over the last 24 hours - 25 points
// an hour apart - so the day's volume is their sum. the last point on
// its own is one hour's volume, and showing it as "24H VOLUME" would
// under-report the dex by a factor of ten.
//
// --- WHY --- the tvl series is NOT summed, above: that one is a
// daily snapshot, so its last point IS the tvl. summing it would add
// every day together, which is not a number that means anything.
async function fetch_volume_fun(): Promise<number> {
  const series = await api_intear_dex_stats_volume_total("day");
  let total = 0;
  for (const point of series) total += to_finite_number_fun(point.volume_usd);
  return total;
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// fetch everything the intear dex page shows.
//
// --- WHY --- the three requests run at the same time: they are three
// different endpoints, so running them together makes the page as
// slow as its slowest one instead of the sum of all three.
//
// --- WHY --- a failed stat does not take the pools down with it. the
// pools are the page; the tvl and the volume are two numbers in the
// header. so each is caught on its own.
async function load_pools_fun(): Promise<HUGGIES_INTEAR_DEX_PAGE_DATA> {
  const [pools_result, tvl_result, volume_result] = await Promise.all([
    api_intear_dex_pools_all(),
    fetch_tvl_fun().then(
      (value) => ({ value, error: null }),
      (err: unknown) => ({
        value: 0,
        error: err instanceof Error ? err.message : String(err),
      }),
    ),
    fetch_volume_fun().then(
      (value) => ({ value, error: null }),
      (err: unknown) => ({
        value: 0,
        error: err instanceof Error ? err.message : String(err),
      }),
    ),
  ]);

  const errors: string[] = [];
  if (tvl_result.error !== null) errors.push(`tvl: ${tvl_result.error}`);
  if (volume_result.error !== null) {
    errors.push(`volume: ${volume_result.error}`);
  }

  const pools = pools_result.map((pool) => map_pool_fun(pool));

  // --- WHY --- the symbols come last: they are needed for every pool
  // at once, so one request covers the whole list. asking for them
  // first would only delay the pools.
  const token_ids = pools.flatMap((pool) => pool.token_ids);
  const tokens = await HUGGIES_POOL_TOKENS.fetch(token_ids);
  for (const pool of pools) {
    pool.symbols = pool.token_ids.map((id) => {
      const token = tokens.get(id);
      return token === undefined ? id : token.symbol;
    });
    pool.icons = pool.token_ids.map((id) => tokens.get(id)?.icon ?? null);
  }

  return {
    pools,
    tvl_usd: tvl_result.value,
    volume_24h_usd: volume_result.value,
    errors,
  };
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_CONTRACT_PAGE_INTEAR_DEX = {
  load: load_pools_fun,
};
// ========================================
// copyright 2026 by sleet.near
