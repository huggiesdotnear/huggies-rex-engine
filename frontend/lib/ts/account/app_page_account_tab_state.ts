// ========================================
// the account page's tab: which of the page's tabs is showing.
//
// the tab is page state, like the account id — it comes from the url
// (`?tab=`), not from auth. components read it through here instead of
// each parsing the url itself.
//
// --- WHY --- it is its own module and not a field on the account id:
// the tab changes on its own. clicking a tab changes the tab and
// nothing else — the balances stay loaded, and the history is fetched
// only when the transactions tab is the one on screen.
//
// --- WHY --- the components of a tab re-render when the tab changes:
// the gate (app_page_account_tab_view.tsx) has to know which tab is on
// screen to decide what to show, so it follows the tab.
//
// --- WHY --- it has the same shape as lib/ts/app_page_account_id.ts:
// plain module state, a subscribe/unsubscribe pair, and a notify that
// a throwing subscriber cannot break. so the two read the same way and
// a component can subscribe to both.
//
// --- WHY --- an unknown tab falls back to the default: a stale link or
// a typo should land on the page, not on an empty page.
import { SHIT_1170_URL_TAB } from "./app_page_account_tab_url";
import {
  find_account_tab_fun,
  SHIT_1170_DEFAULT_ACCOUNT_TAB,
} from "./app_page_account_tab_defs";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the names of the account page's tabs. it is the union of the names in
// lib/ts/app_page_account_tab_defs.ts.
export type SHIT_1170_APP_PAGE_ACCOUNT_TAB = "balances" | "transactions";
// ========================================
// ========================================
// --- STATE ------------------------------
// the tab on screen. it starts as the default so the first render is
// right even before the url has been read.
let tab: SHIT_1170_APP_PAGE_ACCOUNT_TAB = SHIT_1170_DEFAULT_ACCOUNT_TAB;
// plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// ========================================
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing (or unsubscribing
// mid-notify) cannot break the flow that notified.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[account_tab] listener failed", err);
    }
  }
}
// ========================================
// register a re-render callback; returns an unsubscribe to clean up on unmount.
function subscribe_fun(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}
// ========================================
// ========================================
// --- READ ------------------------------
// resolve a raw url value to a tab name, falling back to the default
// when the url names nothing or names a tab that does not exist.
function resolve_tab_fun(raw: string | null): SHIT_1170_APP_PAGE_ACCOUNT_TAB {
  const found = find_account_tab_fun(raw);
  return found === null ? SHIT_1170_DEFAULT_ACCOUNT_TAB : found.name;
}
// ========================================
// ========================================
// --- INIT -------------------------------
// read `?tab=` out of the current url and keep it in step with it.
//
// safe to call more than once.
//
// --- WHY --- THE URL IS READ EVERY TIME AND NOT ONLY ONCE: the tab
// lives in the url, so the url is the truth about which tab is
// showing. a reader who steps back in the browser's history changes
// the url without reloading the page, and the tab bar has to follow
// it.
//
// --- WHY --- THE READING IS THE SHARED lib/ts/url_tab.ts: the trim and
// the blank-means-absent rule live there, so the pages cannot drift.
function init_fun(): void {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return;
  }
  const next = resolve_tab_fun(SHIT_1170_URL_TAB.read());
  if (next === tab) return;
  tab = next;
  notify_fun();
}
// ========================================
// ========================================
// --- READ ------------------------------
// the tab on screen.
function get_tab_fun(): SHIT_1170_APP_PAGE_ACCOUNT_TAB {
  return tab;
}
// ========================================
// ========================================
// --- GET -------------------------------
// the tab on screen, under the name the shared page-store hook wants.
//
// --- WHY --- the hook (lib/ts/use_page_store.ts) drives every page's
// store and it reads the state through `get()`. the tab state is a
// store like any other, so it carries that name too — `get_tab` stays
// as the plainer name for the callers that read the tab directly.
function get_fun(): SHIT_1170_APP_PAGE_ACCOUNT_TAB {
  return tab;
}
// ========================================
// ========================================
// --- SET -------------------------------
// switch to a tab and put it in the url.
//
// --- WHY --- THE URL IS WRITTEN FIRST, AND ALWAYS: the tab lives in
// the url, so the url is the truth about which tab is showing. and it
// is written even when the tab is already the one on screen — the
// reader who clicks the tab they are on, or opens that tab's link in a
// new tab, must get the url the link said.
//
// --- WHY --- THE STATE IS THE SOURCE OF TRUTH FOR THE RENDER: the
// components read the state, and the state is what the reader asked
// for.
//
// --- WHY --- THE SWITCH DOES NOT RELOAD THE PAGE: a tab bar switches a
// view of the page that is already loaded, so the switch is instant and
// the page does not fetch everything again.
function set_tab_fun(next: SHIT_1170_APP_PAGE_ACCOUNT_TAB): void {
  SHIT_1170_URL_TAB.write(next);
  if (next === tab) return;
  tab = next;
  notify_fun();
}
// ========================================
// ========================================
// --- WATCH -----------------------------
// follow the browser's back and forward buttons.
//
// --- WHY --- THE TAB IS IN THE URL: the url says which tab is
// showing, so a reader who steps back in the browser's history lands
// on a different tab. the page has to follow, or the bar would show a
// tab the url does not name.
//
// --- WHY --- IT IS SET UP ONCE: a second listener would read the url
// twice for every step back.
let watching = false;
function watch_fun(): void {
  if (watching) return;
  watching = true;
  if (typeof window === "undefined") return;
  window.addEventListener("popstate", () => {
    init_fun();
  });
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_ACCOUNT_TAB_STATE = {
  init: init_fun,
  subscribe: subscribe_fun,
  get: get_fun,
  get_tab: get_tab_fun,
  set_tab: set_tab_fun,
  watch: watch_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
