// ========================================
// the account id a page is showing, read from the `?id=` url
// parameter — NOT from auth.
//
// this is page state rather than identity: a page can show any account
// for anyone, signed in or not. the signed-in account is only a
// FALLBACK — a real `?id=` always wins, so shared profile links stay
// viewable by guests. and when the url had no id at all, the page
// keeps listening: signing in later fills it in.
//
// the shared module owns that one rule so two pages cannot drift apart
// on how they read the url. the same shape as
// lib/ts/app_page_account_id.ts and lib/ts/auth_status.ts: plain
// module state, a subscribe/unsubscribe pair, and a notify that a
// throwing subscriber cannot break.
// ========================================
import { HUGGIES_AUTH } from "./auth_status";
import { HUGGIES_URL_ID } from "./url_id";
// ========================================
// ========================================
// --- STATE ------------------------------
// the id the page is about. null until an id is resolved, and it stays
// null on a page with no `?id=` and nobody signed in — components
// render nothing in that case.
let account_id: string | null = null;
// true when the URL carried an `?id=` of its own.
// --- WHY --- separate from "do we have an id". a url id is final: a
// sign-in must never replace the player the link points at. but when
// the url had no id and nobody was signed in, the page is still waiting
// for one, and a later sign-in SHOULD light it up. one flag for both
// would freeze the second case.
let has_url_id = false;
// plain array so subscribe/unsubscribe ordering is stable, matching
// auth_status.ts.
const listeners: Array<() => void> = [];
// the unsubscribe from the auth subscription, so it is set up once.
let auth_unsubscribe: (() => void) | null = null;
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
      console.error("[page_account_id] listener failed", err);
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
// the `?id=` off the current url, or null when there is none.
// --- WHY --- the shared lib/ts/url_id.ts does the reading: the trim
// and the blank-means-absent rule live there, so this page and the
// account page cannot drift apart on how the id is found.
function read_url_account_id_fun(): string | null {
  return HUGGIES_URL_ID.read();
}
// ========================================
// --- INIT -------------------------------
// resolve the id: the url first, then the signed-in account as a
// fallback.
// --- WHY --- the url wins over the signed-in account. a link to
// someone else's account must show them, not the reader.
// --- WHY --- HUGGIES_AUTH.init() runs here, before we read the
// account: init is what rehydrates the session from localStorage, so
// without it a fresh page load always looks signed out even when a
// session sits in storage.
// safe to call more than once: a url id is kept once set, so a
// re-render or a second import cannot blank an id we already have.
function init_fun(): void {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return;
  }
  const from_url = read_url_account_id_fun();
  if (from_url !== null) {
    has_url_id = true;
    if (account_id !== from_url) {
      account_id = from_url;
      notify_fun();
    }
    return;
  }
  // no `?id=` on the url — fall back to whoever is signed in.
  HUGGIES_AUTH.init();
  adopt_signed_in_fun();
  // --- WHY --- listen for a later sign-in. the page opened signed out,
  // so it had no player to show; when the reader signs in, the page
  // should show them without a reload. the url id case returns above
  // and never subscribes, so a sign-in cannot steal the page's player.
  if (auth_unsubscribe === null) {
    auth_unsubscribe = HUGGIES_AUTH.subscribe(() => {
      adopt_signed_in_fun();
    });
  }
}
// ========================================
// take the signed-in account as the page's id, if there is one and the
// page is not already showing someone else.
function adopt_signed_in_fun(): void {
  // a url id is final — never override it.
  if (has_url_id) return;
  const signed_in = HUGGIES_AUTH.get_account_id();
  // --- WHY --- a sign-out clears the page. the id came from the
  // session, and the session is gone, so the page has no player to show
  // any more. without this the page kept showing the signed-out
  // player's balance and nfts.
  if (signed_in === null) {
    if (account_id === null) return;
    account_id = null;
    notify_fun();
    return;
  }
  if (account_id === signed_in) return;
  account_id = signed_in;
  notify_fun();
}
// ========================================
// --- READ ------------------------------
// the id this page is about, or null when there is none.
function get_account_id_fun(): string | null {
  return account_id;
}
// ========================================
// true when the page has resolved an id and the components can load.
function has_account_id_fun(): boolean {
  return account_id !== null;
}
// ========================================
// public surface, in one place so components have a single import.
export const HUGGIES_PAGE_ACCOUNT_ID = {
  init: init_fun,
  subscribe: subscribe_fun,
  get_account_id: get_account_id_fun,
  has_account_id: has_account_id_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
