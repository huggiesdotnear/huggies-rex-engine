// ========================================
// data loader for the INTEAR DEX engine contract page.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import {
  NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID,
  NEAR_KIT_INTEAR_DEX_XYK_DEX_ID,
  intear_dex_asset_token_id_fun,
  intear_dex_xyk_get_pool_count_fun_json,
  intear_dex_xyk_get_pools_fun_json,
} from "../../../middleman/near_kit_tool_box";
import type { INTEAR_DEX_XYK_POOL_VIEW_TYPE } from "../../../middleman/near_kit_tool_box";
// ========================================
export interface HUGGIES_INTEAR_POOL {
  pool_id: string;
  kind: string;
  token_ids: string[];
  amounts: string[];
  total_shares: string | null;
}
export interface HUGGIES_INTEAR_DATA {
  pools: HUGGIES_INTEAR_POOL[];
  total_pools: number;
  errors: string[];
}
// ========================================
// how many pools one `get_pools` call returns.
// --- WHY --- 50 is the largest page the sub-dex answers: a bigger
// one runs the contract out of gas and the call fails outright.
const HUGGIES_INTEAR_BATCH_SIZE = 50;
// ========================================
// load the live INTEAR DEX XYK pool collection.
export async function load_intear_dex_page_fun(): Promise<HUGGIES_INTEAR_DATA> {
  const near = near_kit_client();
  const errors: string[] = [];
  let raw_pools: INTEAR_DEX_XYK_POOL_VIEW_TYPE[] = [];
  let total_pools = 0;

  try {
    total_pools = await intear_dex_xyk_get_pool_count_fun_json(
      near,
      NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID,
      NEAR_KIT_INTEAR_DEX_XYK_DEX_ID,
    );
  } catch (err) {
    errors.push(
      `pool count: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  for (
    let offset = 0;
    offset < total_pools;
    offset += HUGGIES_INTEAR_BATCH_SIZE
  ) {
    const limit = Math.min(HUGGIES_INTEAR_BATCH_SIZE, total_pools - offset);
    try {
      const batch = await intear_dex_xyk_get_pools_fun_json(
        near,
        NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID,
        NEAR_KIT_INTEAR_DEX_XYK_DEX_ID,
        offset,
        limit,
      );
      raw_pools = raw_pools.concat(batch);
    } catch (err) {
      errors.push(
        `pools ${offset}-${offset + limit - 1}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      break;
    }
  }

  const pools = raw_pools.map((pool, pool_id) => ({
    pool_id: String(pool_id),
    kind: pool.kind,
    // the dex names its assets in its own encoding; the token id is what
    // the rest of the app (and the token pages) can link to.
    token_ids: pool.assets.map((asset) => {
      try {
        return intear_dex_asset_token_id_fun(asset.asset_id);
      } catch {
        return asset.asset_id;
      }
    }),
    amounts: pool.assets.map((asset) => asset.balance),
    total_shares: pool.total_shares,
  }));
  if (total_pools === 0) total_pools = pools.length;
  return { pools, total_pools, errors };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
