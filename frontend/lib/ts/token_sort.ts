// ========================================
// the shared token sort options used by every token list.
// ========================================
export type HUGGIES_TOKEN_SORT = "volume_usd_24h" | "market_cap_usd";
// ========================================
// the sort direction of a token list.
export type HUGGIES_TOKEN_SORT_DIRECTION = "asc" | "desc";
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
// the default direction for a token list: biggest first.
export const HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION: HUGGIES_TOKEN_SORT_DIRECTION =
  "desc";
// ========================================
// the cache key for one sort + direction pair.
export function token_sort_cache_key_fun(
  sort: HUGGIES_TOKEN_SORT,
  direction: HUGGIES_TOKEN_SORT_DIRECTION,
): string {
  return `${sort}:${direction}`;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
