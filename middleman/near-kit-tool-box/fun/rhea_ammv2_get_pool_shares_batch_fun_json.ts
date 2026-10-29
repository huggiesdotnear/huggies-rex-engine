// ========================================
// RHEA_AMMV2_GET_POOL_SHARES_BATCH_FUN_JSON
// View: `get_pool_shares_batch`. Returns an account's LP shares in a
// batch of pools, in the order the pools were asked for.
//
// the contract caps how many pool ids one call may carry, so the
// batch is bounded here.
// ========================================
import type { Near } from "near-kit";
import type { rhea_ammv2_args } from "../types/near_kit_args";
import type { RHEA_AMMV2_POOL_SHARES_BATCH_TYPE } from "../types/rhea_ammv2_view_types";
// ========================================
// the largest number of pool ids the contract accepts in one batch.
export const RHEA_AMMV2_POOL_SHARES_BATCH_LIMIT = 100;
// ========================================
// fetch LP shares for a bounded batch of Rhea AMM pools.
export async function rhea_ammv2_get_pool_shares_batch_fun_json(
  near: Near,
  rhea_ammv2_contract_id: string,
  pool_ids: rhea_ammv2_args["pool_ids"],
  account_id: rhea_ammv2_args["account_id"],
): Promise<RHEA_AMMV2_POOL_SHARES_BATCH_TYPE> {
  if (pool_ids.length > RHEA_AMMV2_POOL_SHARES_BATCH_LIMIT) {
    throw new Error(
      `Rhea get_pool_shares_batch accepts at most ${RHEA_AMMV2_POOL_SHARES_BATCH_LIMIT} pool ids`,
    );
  }
  const result = await near.view<unknown>(
    rhea_ammv2_contract_id,
    "get_pool_shares_batch",
    { pool_ids, account_id },
  );
  if (
    !Array.isArray(result) ||
    result.some((share) => typeof share !== "string")
  ) {
    throw new Error("Rhea get_pool_shares_batch returned an invalid value");
  }
  return result as RHEA_AMMV2_POOL_SHARES_BATCH_TYPE;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
