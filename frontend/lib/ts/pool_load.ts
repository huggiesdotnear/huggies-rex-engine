// ========================================
// load supported dex pools, using the indexeddb cache when available.
// ========================================
import { get_cached_pools_fun, put_cached_pools_fun } from "./pool_cache";
import { load_rhea_amm_page_fun } from "./rhea_amm_page";
import { load_rhea_dcl_page_fun } from "./rhea_dcl_page";
import { load_intear_dex_page_fun } from "./intear_dex_page";
import { intear_dex_asset_token_id_fun } from "../../../middleman/near_kit_tool_box";
import {
  HUGGIES_POOL_DEX_NAMES,
  HUGGIES_POOL_SCOPE_LABELS,
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
    assets: ReadonlyArray<{ asset_id: string; balance: string }>;
  }>,
): HUGGIES_POOL[] {
  return pools.map((pool, pool_id) => {
    const token_ids = pool.assets.map((asset) => {
      try {
        return intear_dex_asset_token_id_fun(asset.asset_id);
      } catch {
        return asset.asset_id;
      }
    });
    return {
      key: `intear_xyk:${pool_id}`,
      dex: "intear_xyk",
      dex_name: HUGGIES_POOL_DEX_NAMES.intear_xyk,
      pool_id: String(pool_id),
      token_ids,
      amounts: pool.assets.map((asset) => asset.balance),
      liquidity_usd: null,
      main_pool: false,
    };
  });
}
// ========================================
// load one dex's pools, preferring its durable indexeddb cache.
export async function load_dex_pools_fun(
  dex: HUGGIES_POOL_DEX,
): Promise<HUGGIES_POOL[]> {
  const cached = await get_cached_pools_fun(dex);
  if (cached.length > 0) return cached;
  let pools: HUGGIES_POOL[] = [];
  if (dex === "rhea_amm") {
    const data = await load_rhea_amm_page_fun(null);
    pools = map_rhea_amm_pools_fun(
      data.pools.map((pool) => ({
        pool_id: pool.pool_id,
        token_ids: pool.token_ids,
        amounts: pool.amounts,
      })),
    );
  } else if (dex === "rhea_dcl") {
    const data = await load_rhea_dcl_page_fun(null);
    pools = map_rhea_dcl_pools_fun(data.pools);
  } else {
    const data = await load_intear_dex_page_fun(null);
    pools = map_intear_pools_fun(data.pools);
  }
  await put_cached_pools_fun(dex, pools);
  return pools;
}
// ========================================
// describe the bounded pool scope used by one dex loader.
export function pool_scope_label_fun(dex: HUGGIES_POOL_DEX): string {
  return HUGGIES_POOL_SCOPE_LABELS[dex];
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
