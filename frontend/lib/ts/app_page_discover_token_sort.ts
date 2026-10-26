// ========================================
// the shared token sort options used by every token list.
// ========================================
export type HUGGIES_TOKEN_SORT = "default" | "volume_usd_24h" | "market_cap_usd";
// ========================================
// the sort direction of a token list.
export type HUGGIES_TOKEN_SORT_DIRECTION = "asc" | "desc";
// ========================================
// the sort options in the order they are offered to the user.
export const HUGGIES_TOKEN_SORTS: ReadonlyArray<{
  key: HUGGIES_TOKEN_SORT;
  label: string;
}> = [
  { key: "default", label: "DEFAULT" },
  { key: "volume_usd_24h", label: "VOLUME" },
  { key: "market_cap_usd", label: "MARKET CAP" },
];
// ========================================
// the default sort for a token list.
export const HUGGIES_DEFAULT_TOKEN_SORT: HUGGIES_TOKEN_SORT = "default";
// the default direction for a token list: biggest first.
export const HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION: HUGGIES_TOKEN_SORT_DIRECTION =
  "desc";
// ========================================
// the numeric field a sort key orders by. the `default` key has no
// field of its own — it is the favourites-first view, which falls back
// to volume for the tokens after the favourites.
export function token_sort_field_fun(
  sort: HUGGIES_TOKEN_SORT,
): "volume_usd_24h" | "market_cap_usd" {
  return sort === "market_cap_usd" ? "market_cap_usd" : "volume_usd_24h";
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
