// ========================================
// the account id the current page is showing, read from the `?id=`
// url parameter — NOT from auth. account.html renders any account
// for anyone, signed in or not, so this is page state rather than
// identity. components on that page read it through here instead
// of each parsing the url itself.
// ========================================
import { HUGGIES_URL_ID } from "./url_id";
// ========================================
// ========================================
// --- STATE ------------------------------
// null until init() reads the url, and stays null on a page with no
// `?id=` — components render nothing in that case.
let account_id: string | null = null;
// plain array so subscribe/unsubscribe ordering is stable, matching
// auth_status.ts.
const listeners: Array<() => void> = [];
// ========================================
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing (or
// unsubscribing mid-notify) cannot break the flow that notified.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[account_id] listener failed", err);
    }
  }
}
// ========================================
// register a re-render callback; returns an unsubscribe so components
// can clean up on unmount instead of leaking.
function subscribe_fun(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}
// ========================================
// ========================================
// --- INIT -------------------------------
// read `?id=` out of the current url once and keep it. safe to call
// more than once; the url is only read when nothing is set yet, so a
// re-render or a second import cannot blank an id we already have.
//
// --- WHY --- the reading is the shared lib/ts/url_id.ts: the trim and
// the blank-means-absent rule live there, so this page and the token
// page cannot drift apart on how the id is found.
function init_fun(): void {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return;
  }
  if (account_id !== null) return;
  account_id = HUGGIES_URL_ID.read();
  notify_fun();
}
// ========================================
// ========================================
// --- READ ------------------------------
// the id this page is about, or null when there is no `?id=`.
function get_account_id_fun(): string | null {
  return account_id;
}
// ========================================
// ========================================
// public surface, in one place so components have a single import.
export const HUGGIES_APP_PAGE_ACCOUNT_ID = {
  init: init_fun,
  subscribe: subscribe_fun,
  get_account_id: get_account_id_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
