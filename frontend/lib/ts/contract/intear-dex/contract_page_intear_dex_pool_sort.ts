// ========================================
// the intear dex page's pool sort options.
//
// the dex api has no sort of its own — /pools/all answers with every
// pool in one go — so the sort is ours, over the rows the api already
// sent. see lib/ts/contract_page_intear_dex_store.ts.
// ========================================
// ========================================
// --- TYPES ------------------------------
// the sort direction of a pool list.
export type HUGGIES_INTEAR_DEX_POOL_SORT_DIRECTION = "asc" | "desc";
// ========================================
// the sort keys a pool list can be ordered by.
export type HUGGIES_INTEAR_DEX_POOL_SORT =
  "tvl" | "volume_24h" | "volume_7d" | "apy";
// ========================================
// the sort options in the order they are offered to the user.
export const HUGGIES_INTEAR_DEX_POOL_SORTS: ReadonlyArray<{
  key: HUGGIES_INTEAR_DEX_POOL_SORT;
  label: string;
}> = [
  { key: "tvl", label: "TVL" },
  { key: "volume_24h", label: "24H VOL" },
  { key: "volume_7d", label: "7D VOL" },
  { key: "apy", label: "APY" },
];
// ========================================
// the default sort: the pools with the most money in them.
export const HUGGIES_DEFAULT_INTEAR_DEX_POOL_SORT: HUGGIES_INTEAR_DEX_POOL_SORT =
  "tvl";
// the default direction: biggest first.
export const HUGGIES_DEFAULT_INTEAR_DEX_POOL_SORT_DIRECTION: HUGGIES_INTEAR_DEX_POOL_SORT_DIRECTION =
  "desc";
// ========================================
// copyright 2026 by sleet.near
