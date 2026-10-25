// ========================================
// data loader for the INTEAR DEX engine contract page.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import {
  NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID,
  NEAR_KIT_INTEAR_DEX_XYK_DEX_ID,
  intear_dex_engine_registered_assets_of_fun_json,
  intear_dex_xyk_get_pool_shares_fun_json,
  intear_dex_xyk_get_pools_fun_json,
} from "../../../middleman/near_kit_tool_box";
import type { INTEAR_DEX_XYK_POOL_VIEW_TYPE } from "../../../middleman/near_kit_tool_box";
// ========================================
export interface HUGGIES_INTEAR_ASSET {
  asset_id: string;
  balance: string;
}
export interface HUGGIES_INTEAR_DATA {
  pools: INTEAR_DEX_XYK_POOL_VIEW_TYPE[];
  assets: HUGGIES_INTEAR_ASSET[];
  shares: Array<string | null>;
  errors: string[];
}
// ========================================
const HUGGIES_INTEAR_SHARE_BATCH_LIMIT = 100;
const HUGGIES_INTEAR_POOL_LIMIT = 71;
// ========================================
// load live XYK pools, registered account assets, and LP shares.
export async function load_intear_dex_page_fun(
  account_id: string | null,
): Promise<HUGGIES_INTEAR_DATA> {
  const near = near_kit_client();
  const errors: string[] = [];
  let pools: INTEAR_DEX_XYK_POOL_VIEW_TYPE[] = [];
  let assets: HUGGIES_INTEAR_ASSET[] = [];
  let shares: Array<string | null> = [];

  try {
    pools = await intear_dex_xyk_get_pools_fun_json(
      near,
      NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID,
      NEAR_KIT_INTEAR_DEX_XYK_DEX_ID,
      0,
      HUGGIES_INTEAR_POOL_LIMIT,
    );
  } catch (err) {
    errors.push(`pools: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (account_id !== null) {
    try {
      const registered = await intear_dex_engine_registered_assets_of_fun_json(
        near,
        NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID,
        account_id,
        null,
        0,
        500,
      );
      assets = registered.map((row) => ({
        asset_id: row.asset_id,
        balance: row.balance,
      }));
    } catch (err) {
      errors.push(
        `assets: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    try {
      const pool_ids = pools.map((_pool, index) => index);
      for (
        let offset = 0;
        offset < pool_ids.length;
        offset += HUGGIES_INTEAR_SHARE_BATCH_LIMIT
      ) {
        const batch = pool_ids.slice(
          offset,
          offset + HUGGIES_INTEAR_SHARE_BATCH_LIMIT,
        );
        const values = await intear_dex_xyk_get_pool_shares_fun_json(
          near,
          NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID,
          NEAR_KIT_INTEAR_DEX_XYK_DEX_ID,
          batch,
          account_id,
        );
        shares.push(...values.map((value) => value.shares));
      }
    } catch (err) {
      errors.push(
        `shares: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  return { pools, assets, shares, errors };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
