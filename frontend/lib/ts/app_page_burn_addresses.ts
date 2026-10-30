// ========================================
// the burn addresses the burn page shows.
//
// these are constants: the page is about two community burn accounts,
// and neither changes while the page is open.
//
// --- WHY --- they live here and not in the loader: the loader holds what
// the page FETCHES. it is the one place both the address cards and the
// balances loader read from, so they cannot drift apart.
// ========================================
// each account has no access keys, so anything sent to it is locked forever.
export const HUGGIES_BURN_ADDRESSES: ReadonlyArray<string> = [
  "burn.sleet.near",
  "burn.huggies.near",
];
// ========================================
// copyright 2026 by sleet.near
// ========================================
