// ========================================
// the burn addresses the burn page shows.
//
// these are constants: the page is about two community burn accounts,
// and neither of them changes while the page is open.
//
// --- WHY --- they live here and not in the loader: the loader holds
// what the page FETCHES, and this list is not fetched. it is the one
// place both the address cards and the balances loader read from, so
// the two can never drift apart and name a different account.
// ========================================
// the community burn accounts. each one is an account with no access
// keys, so anything sent to it is locked forever.
export const HUGGIES_BURN_ADDRESSES: ReadonlyArray<string> = [
  "burn.sleet.near",
  "burn.huggies.near",
];
// ========================================
// copyright 2026 by sleet.near
// ========================================
