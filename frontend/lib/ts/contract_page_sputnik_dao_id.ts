// ========================================
// the dao the page is showing, read from the `?dao_id=` url parameter.
//
// this is page state, not identity: the page shows one dao for
// anyone, signed in or not. the signed-in account only supplies the
// LIST of daos to choose from.
//
// the shape is the same as lib/ts/page_account_id.ts: plain module
// state, a subscribe/unsubscribe pair, and a notify that a throwing
// subscriber cannot break.
// ========================================
// --- STATE ------------------------------
// the dao the page is about. null until one is resolved.
let dao_id: string | null = null;
// true when the URL carried a `?dao_id=` of its own.
//
// --- WHY --- this is separate from "do we have a dao". a url id is
// final: a sign-in must never replace the dao the link points at.
let has_url_id = false;
// plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing (or
// unsubscribing mid-notify) cannot break the flow that notified.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[contract_page_sputnik_dao_id] listener failed", err);
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
// trim the raw `?dao_id=` value, treating blank as absent so a
// trailing `?dao_id=` link resolves to nothing rather than an empty
// heading.
function normalize_dao_id_fun(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}
// ========================================
// --- READ ------------------------------
// the `?dao_id=` off the current url, or null when there is none.
function read_url_dao_id_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_dao_id_fun(params.get("dao_id"));
}
// ========================================
// --- WRITE -----------------------------
// set the dao the page is about.
function set_dao_id_fun(next: string | null): void {
  const normalized = normalize_dao_id_fun(next);
  if (normalized === null) return;
  if (dao_id === normalized) return;
  dao_id = normalized;
  notify_fun();
}
// ========================================
// --- PUBLIC ---------------------------
// public surface, in one place so components have a single import.
export const HUGGIES_CONTRACT_SPUTNIK_DAO_ID = {
  subscribe: subscribe_fun,
  get: read_url_dao_id_fun,
  set: set_dao_id_fun,
  has_url_id: () => has_url_id,
  mark_url_id: () => {
    has_url_id = true;
  },
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
