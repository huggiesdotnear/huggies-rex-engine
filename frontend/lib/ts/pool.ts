// ========================================
// the shared pool record for every supported decentralized exchange.
// ========================================
export type HUGGIES_POOL_DEX = "rhea_amm" | "rhea_dcl" | "intear_xyk";
export interface HUGGIES_POOL {
  key: string;
  dex: HUGGIES_POOL_DEX;
  dex_name: string;
  pool_id: string;
  token_ids: string[];
  amounts: string[];
  liquidity_usd: number | null;
  main_pool: boolean;
}
// ========================================
// one dex's cached pool collection plus the metadata that says whether
// the cache holds every pool the contract has.
export interface HUGGIES_POOL_CACHE {
  key: string;
  fetched_at_millis: number;
  // the number of pools the contract reported when the cache was written.
  total_pools: number;
  // how many pools the cache actually holds.
  cached_pools: number;
  pools: HUGGIES_POOL[];
}
// ========================================
// how long a cached collection is served without asking the contract
// again. the cache is complete, so a stale list is still useful; the
// refresh happens in the background.
export const HUGGIES_POOL_CACHE_TTL_MS = 5 * 60 * 1000;
// ========================================
export const HUGGIES_POOL_DEX_NAMES: Record<HUGGIES_POOL_DEX, string> = {
  rhea_amm: "Rhea AMM",
  rhea_dcl: "Rhea DCL",
  intear_xyk: "INTEAR DEX / XYK",
};
// ========================================
// the indexeddb store that holds each dex's pool collection.
export const HUGGIES_POOL_STORE_NAMES: Record<HUGGIES_POOL_DEX, string> = {
  rhea_amm: "pools_rhea_amm",
  rhea_dcl: "pools_rhea_dcl",
  intear_xyk: "pools_intear_xyk",
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
