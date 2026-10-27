// ========================================
// the account id a page is showing, read from the `?id=` url
// parameter — NOT from auth.
//
// this is page state rather than identity: a page can show any account
// for anyone, signed in or not. the shared module owns that one rule so
// two pages cannot drift apart on how they read the url.
//
// the signed-in account is only a FALLBACK. a real `?id=` always wins,
// so shared profile links stay viewable by guests.
//
// the same shape as lib/ts/app_page_account_id.ts and
// lib/ts/auth_status.ts: plain module state, a subscribe/unsubscribe
// pair, and a notify that a throwing subscriber cannot break.
// ========================================
import { HUGGIES_AUTH } from "./auth_status";
// ========================================
// ========================================
// --- STATE ------------------------------
// the id the page is about. null until init() resolves one, and it
// stays null on a page with no `?id=` and nobody signed in — components
// render nothing in that case.
let account_id: string | null = null;
// true once the id has been resolved. after that the page does not
// re-resolve, so a `?id=` cannot be overwritten by a late sign-in.
let resolved = false;
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
// trim the raw `?id=` value, treating blank as absent so a trailing
// `?id=` link resolves to nothing rather than an empty heading.
function normalize_account_id_fun(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}
// ========================================
// the `?id=` off the current url, or null when there is none.
function read_url_account_id_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_account_id_fun(params.get("id"));
}
// ========================================
// --- INIT -------------------------------
// resolve the id once: the url first, then the signed-in account as a
// fallback.
//
// --- WHY --- init() must run BEFORE get_account_id(): init is what
// rehydrates the session from localStorage, so without it a fresh page
// load always looks signed out even when a session sits in storage.
//
// --- WHY --- the url wins over the signed-in account. a link to
// someone else's account must show them, not the reader.
//
// --- WHY --- init() must run AFTER HUGGIES_AUTH.init(). the auth
// module clears and re-derives its own state on init, so asking it for
// the account before that would read a stale value.
//
// safe to call more than once: the id is resolved once and kept, so a
// re-render or a second import cannot blank an id we already have.
function init_fun(): void {
  if (resolved) return;
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return;
  }
  const from_url = read_url_account_id_fun();
  if (from_url !== null) {
    account_id = from_url;
    resolved = true;
    notify_fun();
    return;
  }
  // no `?id=` — fall back to whoever is signed in.
  HUGGIES_AUTH.init();
  const signed_in = HUGGIES_AUTH.get_account_id();
  if (signed_in !== null) {
    account_id = signed_in;
    resolved = true;
    notify_fun();
  }
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
