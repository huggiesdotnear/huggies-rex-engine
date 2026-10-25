// ========================================
// load supported dex pools, using the indexeddb cache when available.
// ========================================
import {
  get_cached_pools_fun,
  pool_cache_is_stale_fun,
  put_cached_pools_fun,
} from "./pool_cache";
import { load_rhea_amm_page_fun } from "./rhea_amm_page";
import { load_rhea_dcl_page_fun } from "./rhea_dcl_page";
import { load_intear_dex_page_fun } from "./intear_dex_page";
import {
  HUGGIES_POOL_DEX_NAMES,
  type HUGGIES_POOL,
  type HUGGIES_POOL_DEX,
} from "./pool";
// ========================================
// convert Rhea AMM contract pools into shared pool records.
function map_rhea_amm_pools_fun(
  pools: ReadonlyArray<{
    pool_id: number;
    token_ids: string[];
    amounts: string[];
  }>,
): HUGGIES_POOL[] {
  return pools.map((pool) => ({
    key: `rhea_amm:${pool.pool_id}`,
    dex: "rhea_amm",
    dex_name: HUGGIES_POOL_DEX_NAMES.rhea_amm,
    pool_id: String(pool.pool_id),
    token_ids: pool.token_ids,
    amounts: pool.amounts,
    liquidity_usd: null,
    main_pool: false,
  }));
}
// ========================================
// convert Rhea DCL contract pools into shared pool records.
function map_rhea_dcl_pools_fun(
  pools: ReadonlyArray<{
    pool_id: string;
    token_x: string;
    token_y: string;
    total_x: string;
    total_y: string;
  }>,
): HUGGIES_POOL[] {
  return pools.map((pool) => ({
    key: `rhea_dcl:${pool.pool_id}`,
    dex: "rhea_dcl",
    dex_name: HUGGIES_POOL_DEX_NAMES.rhea_dcl,
    pool_id: pool.pool_id,
    token_ids: [pool.token_x, pool.token_y],
    amounts: [pool.total_x, pool.total_y],
    liquidity_usd: null,
    main_pool: false,
  }));
}
// ========================================
// convert INTEAR XYK contract pools into shared pool records.
function map_intear_pools_fun(
  pools: ReadonlyArray<{
    pool_id: string;
    token_ids: string[];
    amounts: string[];
  }>,
): HUGGIES_POOL[] {
  return pools.map((pool) => ({
    key: `intear_xyk:${pool.pool_id}`,
    dex: "intear_xyk",
    dex_name: HUGGIES_POOL_DEX_NAMES.intear_xyk,
    pool_id: pool.pool_id,
    token_ids: pool.token_ids,
    amounts: pool.amounts,
    liquidity_usd: null,
    main_pool: false,
  }));
}
// ========================================
// load one dex's pools, preferring its durable indexeddb cache.
// --- WHY --- the cache holds every pool the contract has, so a search
// over it is instant and complete. a stale cache is still served right
// away while the fresh copy is fetched in the background.
export async function load_dex_pools_fun(
  dex: HUGGIES_POOL_DEX,
): Promise<HUGGIES_POOL[]> {
  const cached = await get_cached_pools_fun(dex);
  if (cached !== null && cached.pools.length > 0) {
    if (!pool_cache_is_stale_fun(cached)) return cached.pools;
    // refresh in the background; the caller already has a usable list.
    void refresh_dex_pools_fun(dex);
    return cached.pools;
  }
  return refresh_dex_pools_fun(dex);
}
// ========================================
// fetch one dex's pools from the contract and write them to the cache.
export async function refresh_dex_pools_fun(
  dex: HUGGIES_POOL_DEX,
): Promise<HUGGIES_POOL[]> {
  let pools: HUGGIES_POOL[] = [];
  let total_pools = 0;
  if (dex === "rhea_amm") {
    const data = await load_rhea_amm_page_fun();
    total_pools = data.total_pools;
    pools = map_rhea_amm_pools_fun(
      data.pools.map((pool) => ({
        pool_id: pool.pool_id,
        token_ids: pool.token_ids,
        amounts: pool.amounts,
      })),
    );
  } else if (dex === "rhea_dcl") {
    const data = await load_rhea_dcl_page_fun();
    total_pools = data.total_pools;
    pools = map_rhea_dcl_pools_fun(data.pools);
  } else {
    const data = await load_intear_dex_page_fun();
    total_pools = data.total_pools;
    pools = map_intear_pools_fun(data.pools);
  }
  await put_cached_pools_fun(dex, pools, total_pools);
  return pools;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
