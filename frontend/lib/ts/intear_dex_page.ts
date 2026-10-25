// ========================================
// data loader for the INTEAR DEX engine contract page.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import {
  NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID,
  NEAR_KIT_INTEAR_DEX_XYK_DEX_ID,
  intear_dex_asset_token_id_fun,
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
  errors: string[];
}
// ========================================
const HUGGIES_INTEAR_POOL_LIMIT = 71;
// ========================================
// load the live INTEAR DEX XYK pool collection.
export async function load_intear_dex_page_fun(): Promise<HUGGIES_INTEAR_DATA> {
  const near = near_kit_client();
  const errors: string[] = [];
  let raw_pools: INTEAR_DEX_XYK_POOL_VIEW_TYPE[] = [];

  try {
    raw_pools = await intear_dex_xyk_get_pools_fun_json(
      near,
      NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID,
      NEAR_KIT_INTEAR_DEX_XYK_DEX_ID,
      0,
      HUGGIES_INTEAR_POOL_LIMIT,
    );
  } catch (err) {
    errors.push(`pools: ${err instanceof Error ? err.message : String(err)}`);
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
  return { pools, errors };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
