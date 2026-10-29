// ========================================
// RHEA_AMMV2_GET_POOL_SHARES_FUN_JSON
// View: `get_pool_shares`. Returns an account's LP shares in one pool.
// ========================================
import type { Near } from "near-kit";
import type { rhea_ammv2_args } from "../types/near_kit_args";
import type { RHEA_AMMV2_POOL_SHARES_TYPE } from "../types/rhea_ammv2_view_types";
// ========================================
// fetch one Rhea AMM pool's LP shares for an account.
export async function rhea_ammv2_get_pool_shares_fun_json(
  near: Near,
  rhea_ammv2_contract_id: string,
  pool_id: rhea_ammv2_args["pool_id"],
  account_id: rhea_ammv2_args["account_id"],
): Promise<RHEA_AMMV2_POOL_SHARES_TYPE> {
  const result = await near.view<unknown>(
    rhea_ammv2_contract_id,
    "get_pool_shares",
    { pool_id, account_id },
  );
  if (typeof result !== "string") {
    throw new Error("Rhea get_pool_shares returned an invalid value");
  }
  return result;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
