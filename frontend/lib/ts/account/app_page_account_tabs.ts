// ========================================
// the account page's tabs: the names, the labels and which one is the
// default.
//
// the list is a constant so there is ONE place to add a tab. the tab
// bar reads it and the tab state reads it, and neither of them holds
// its own copy of the names.
//
// --- WHY --- the default tab has a NAME and not just a position: the
// url says which tab is showing, so the default needs a name that can
// be written to the url too. `balances` is the default and the url
// carries no `?tab=` for it, which is the cleanest url for the view
// most readers want.
// ========================================
import type { HUGGIES_APP_PAGE_ACCOUNT_TAB } from "./app_page_account_tab";
// ========================================
// ========================================
// --- TYPES ------------------------------
export interface HUGGIES_ACCOUNT_TAB_DEF {
  // the name the url carries. it is what `?tab=` holds.
  name: HUGGIES_APP_PAGE_ACCOUNT_TAB;
  // the label the tab bar shows.
  label: string;
}
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the tabs, in the order the bar shows them.
export const HUGGIES_ACCOUNT_TABS: ReadonlyArray<HUGGIES_ACCOUNT_TAB_DEF> = [
  { name: "balances", label: "BALANCES" },
  { name: "transactions", label: "TRANSACTIONS" },
];
// ========================================
// ========================================
// --- DEFAULT ---------------------------
// the tab shown when the url names none.
//
// --- WHY --- it is the first tab in the list rather than a second
// literal: the list is the one place the tabs are written down, and a
// separate constant could name a tab that does not exist.
export const HUGGIES_DEFAULT_ACCOUNT_TAB: HUGGIES_APP_PAGE_ACCOUNT_TAB =
  HUGGIES_ACCOUNT_TABS[0].name;
// ========================================
// ========================================
// --- LOOKUP ---------------------------
// the tab with the given name, or null when the url names a tab that
// does not exist.
//
// --- WHY --- an unknown tab falls back to the default rather than
// showing nothing: a stale link or a typo should land on the page, not
// on an empty page.
export function find_account_tab_fun(
  name: string | null,
): HUGGIES_ACCOUNT_TAB_DEF | null {
  if (name === null) return null;
  for (const tab of HUGGIES_ACCOUNT_TABS) {
    if (tab.name === name) return tab;
  }
  return null;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
