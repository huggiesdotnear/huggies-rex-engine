// ========================================
// the shared token sort options used by every token list.
// ========================================
export type HUGGIES_TOKEN_SORT = "volume_usd_24h" | "market_cap_usd";
// ========================================
// the sort options in the order they are offered to the user.
export const HUGGIES_TOKEN_SORTS: ReadonlyArray<{
  key: HUGGIES_TOKEN_SORT;
  label: string;
}> = [
  { key: "volume_usd_24h", label: "VOLUME" },
  { key: "market_cap_usd", label: "MARKET CAP" },
];
// ========================================
// the default sort for a token list.
export const HUGGIES_DEFAULT_TOKEN_SORT: HUGGIES_TOKEN_SORT = "volume_usd_24h";
// ========================================
// copyright 2026 by sleet.near
// ========================================
