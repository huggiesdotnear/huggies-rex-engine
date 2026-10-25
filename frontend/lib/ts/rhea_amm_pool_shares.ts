// ========================================
// typed helper for Rhea AMM account LP shares.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
// ========================================
const HUGGIES_RHEA_SHARE_BATCH_LIMIT = 100;
// ========================================
// fetch one Rhea AMM pool's LP shares for an account.
export async function rhea_amm_pool_shares_fun(
  pool_id: number,
  account_id: string,
): Promise<string> {
  const value = await near_kit_client().view<unknown>(
    "v2.ref-finance.near",
    "get_pool_shares",
    { pool_id, account_id },
  );
  if (typeof value !== "string") {
    throw new Error("Rhea get_pool_shares returned an invalid value");
  }
  return value;
}
// ========================================
// fetch LP shares for a bounded batch of Rhea AMM pools.
export async function rhea_amm_pool_shares_batch_fun(
  pool_ids: number[],
  account_id: string,
): Promise<string[]> {
  if (pool_ids.length > HUGGIES_RHEA_SHARE_BATCH_LIMIT) {
    throw new Error(
      `Rhea get_pool_shares_batch accepts at most ${HUGGIES_RHEA_SHARE_BATCH_LIMIT} pool ids`,
    );
  }
  const value = await near_kit_client().view<unknown>(
    "v2.ref-finance.near",
    "get_pool_shares_batch",
    { pool_ids, account_id },
  );
  if (
    !Array.isArray(value) ||
    value.some((share) => typeof share !== "string")
  ) {
    throw new Error("Rhea get_pool_shares_batch returned an invalid value");
  }
  return value as string[];
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
