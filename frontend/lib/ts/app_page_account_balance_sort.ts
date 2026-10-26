// ========================================
// sorting for the account balance table. only two orders are offered —
// ticker and usd value — because those are the two a reader actually
// scans for; direction is the caller's to hold.
import type { HUGGIES_APP_PAGE_ACCOUNT_BALANCE_ENTRY } from "./app_page_account_balance_filter";
// ========================================
// ========================================
// --- TYPES ------------------------------
export type HUGGIES_APP_PAGE_ACCOUNT_SORT_BY = "symbol" | "usd";
// ========================================
// ========================================
// --- SORT ------------------------------
// order entries by one of the two supported keys.
// --- WHY --- ticker comparison is case-insensitive with a numeric
// fallback inside compare_fun: raw string order puts "10" before "9"
// and sorts lowercase before uppercase, both of which look broken in a
// ticker column.
function sort_entries_fun(
  entries: ReadonlyArray<HUGGIES_APP_PAGE_ACCOUNT_BALANCE_ENTRY>,
  by: HUGGIES_APP_PAGE_ACCOUNT_SORT_BY,
  desc: boolean,
): ReadonlyArray<HUGGIES_APP_PAGE_ACCOUNT_BALANCE_ENTRY> {
  const sorted = [...entries].sort((a, b) => {
    if (by === "usd") return a.usd_value - b.usd_value;
    return a.info.symbol.localeCompare(b.info.symbol, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
  if (!desc) return sorted;
  return sorted.reverse();
}
// ========================================
// ========================================
// the sorting surface in one object.
export const HUGGIES_APP_PAGE_ACCOUNT_BALANCE_SORT = {
  sort: sort_entries_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================