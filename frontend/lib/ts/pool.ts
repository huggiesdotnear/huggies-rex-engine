// ========================================
// shared pool records for supported decentralized exchanges.
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
export interface HUGGIES_POOL_CACHE {
  key: string;
  fetched_at_millis: number;
  pools: HUGGIES_POOL[];
}
export const HUGGIES_POOL_SCOPE_LABELS: Record<HUGGIES_POOL_DEX, string> = {
  rhea_amm: "FIRST 500 POOLS",
  rhea_dcl: "FIRST 500 POOLS",
  intear_xyk: "FIRST 71 POOLS",
};
export const HUGGIES_POOL_DEX_NAMES: Record<HUGGIES_POOL_DEX, string> = {
  rhea_amm: "Rhea AMM",
  rhea_dcl: "Rhea DCL",
  intear_xyk: "INTEAR DEX / XYK",
};
export const HUGGIES_POOL_STORE_NAMES: Record<HUGGIES_POOL_DEX, string> = {
  rhea_amm: "pools_rhea_amm",
  rhea_dcl: "pools_rhea_dcl",
  intear_xyk: "pools_intear_xyk",
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
