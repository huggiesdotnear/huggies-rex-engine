// ========================================
// shared pool statistics and filtering for the contract pages.
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
// filter pools by a token query and optional exact token id.
export function filter_pools_fun<
  T extends { token_ids: ReadonlyArray<string> },
>(
  pools: ReadonlyArray<T>,
  query: string,
  token_id: string | null,
): T[] {
  const needle = query.trim().toLowerCase();
  return pools.filter((pool) => {
    if (token_id !== null && !pool.token_ids.includes(token_id)) return false;
    if (needle.length === 0) return true;
    return pool.token_ids.some((id) => id.toLowerCase().includes(needle));
  });
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
