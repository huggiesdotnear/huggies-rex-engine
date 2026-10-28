// ========================================
// the chain's own token, NEAR.
//
// --- WHY --- intear has NO `near` entry in /tokens — it comes back in
// the response's `missing` list — so the chain's own token has to be
// described here or a native balance cannot be rendered at all.
//
// this was written twice: once in lib/ts/token_info.ts (the account
// page's read-through) and once in lib/ts/app_page_burn.ts (the burn
// page). two copies of "NEAR has 24 decimals and borrows wNEAR's icon"
// is two places to forget to update, so it is here now.
//
// 24 decimals is the NEAR protocol constant, not a fetched value.
//
// the 1:1 wrapper stands in for NEAR's icon and supply: wNEAR tracks
// NEAR one for one, so its supply is the same number and its icon IS
// the NEAR logo (the green "N"), not a lookalike.
export const HUGGIES_NEAR_ID = "near";
export const HUGGIES_NEAR_SYMBOL = "NEAR";
export const HUGGIES_NEAR_DECIMALS = 24;
export const HUGGIES_WRAP_ID = "wrap.near";
// ========================================
// copyright 2026 by sleet.near
// ========================================
