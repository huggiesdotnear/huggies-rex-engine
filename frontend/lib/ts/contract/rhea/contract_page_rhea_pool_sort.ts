// ========================================
// the rhea page's pool sort options.
//
// the rhea api sorts by a FIELD name, and the field names are its own:
// the 24 hour volume is called `24h`, not `volume_24h`. so the sort
// keys here are the api's own names, not ours.
// ========================================
// ========================================
// --- TYPES ------------------------------
// the sort direction of a pool list.
export type SHIT_1170_RHEA_POOL_SORT_DIRECTION = "asc" | "desc";
// ========================================
// the sort keys the rhea api accepts.
export type SHIT_1170_RHEA_POOL_SORT = "tvl" | "24h" | "apy";
// ========================================
// the sort options in the order they are offered to the user.
export const SHIT_1170_RHEA_POOL_SORTS: ReadonlyArray<{
  key: SHIT_1170_RHEA_POOL_SORT;
  label: string;
}> = [
  { key: "tvl", label: "TVL" },
  { key: "24h", label: "VOLUME" },
  { key: "apy", label: "APY" },
];
// ========================================
// the default sort: the pools with the most money in them.
export const SHIT_1170_DEFAULT_RHEA_POOL_SORT: SHIT_1170_RHEA_POOL_SORT = "tvl";
// the default direction: biggest first.
export const SHIT_1170_DEFAULT_RHEA_POOL_SORT_DIRECTION: SHIT_1170_RHEA_POOL_SORT_DIRECTION =
  "desc";
// ========================================
// copyright 2026 by sleet.near
