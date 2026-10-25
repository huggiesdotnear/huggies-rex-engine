// ========================================
// shared pool statistics for the contract pages.
// ========================================
export interface HUGGIES_POOL_SUMMARY {
  total_pools: number;
  unique_tokens: number;
  token_ids: string[];
}
// ========================================
// build pool totals and the unique token list for one pool collection.
export function pool_summary_fun(
  pools: ReadonlyArray<{ token_ids: ReadonlyArray<string> }>,
): HUGGIES_POOL_SUMMARY {
  const token_ids = new Set<string>();
  for (const pool of pools) {
    for (const token_id of pool.token_ids) token_ids.add(token_id);
  }
  return {
    total_pools: pools.length,
    unique_tokens: token_ids.size,
    token_ids: [...token_ids].sort((a, b) => a.localeCompare(b)),
  };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
