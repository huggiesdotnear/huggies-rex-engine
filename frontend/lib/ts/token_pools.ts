// ========================================
// find every supported dex pool containing one token.
// ========================================
import { load_dex_pools_fun } from "./pool_load";
import type { HUGGIES_POOL } from "./pool";
// ========================================
// load and filter pools from all supported dexes for one token.
export async function load_token_pools_fun(
  token_id: string,
): Promise<HUGGIES_POOL[]> {
  const dexes = ["rhea_amm", "rhea_dcl", "intear_xyk"] as const;
  const results = await Promise.allSettled(
    dexes.map((dex) => load_dex_pools_fun(dex)),
  );
  const pools: HUGGIES_POOL[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const pool of result.value) {
      if (pool.token_ids.includes(token_id)) pools.push(pool);
    }
  }
  return pools;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
