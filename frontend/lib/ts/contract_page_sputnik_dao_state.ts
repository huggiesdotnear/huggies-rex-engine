// ========================================
// the DAO page's state: the loaded dao, the daos the reader can pick
// from, and the errors.
//
// one store, because the page is split into components — the selector,
// the header, the roles and the proposals — and they all read the same
// load. the loader writes here and the components subscribe, so no
// component fetches anything itself.
//
// the shape is the same as lib/ts/page_account_id.ts: plain module
// state, a subscribe/unsubscribe pair, and a notify that a throwing
// subscriber cannot break.
// ========================================
import type { HUGGIES_DAO_INFO } from "./contract_page_sputnik_dao";
import type { HUGGIES_TREASURY } from "../../../middleman/huggies";
// ========================================
// --- TYPES ------------------------------
export interface HUGGIES_DAO_PAGE_STATE {
  // the dao being shown, or null while it loads.
  dao: HUGGIES_DAO_INFO | null;
  // the daos the signed-in account is a member of.
  treasuries: HUGGIES_TREASURY[];
  // the account whose daos are listed. null when nobody is signed in.
  account_id: string | null;
  // true while the page is loading.
  loading: boolean;
  // one message per thing that failed.
  errors: string[];
}
// ========================================
// --- STATE ------------------------------
// the page's state. the empty state is what the page holds before the
// first load answers.
let state: HUGGIES_DAO_PAGE_STATE = {
  dao: null,
  treasuries: [],
  account_id: null,
  loading: false,
  errors: [],
};
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
      console.error("[contract_page_sputnik_dao_state] listener failed", err);
    }
  }
}
// ========================================
// --- WRITE ------------------------------
// replace the page's state and tell the subscribers.
function set_state_fun(next: HUGGIES_DAO_PAGE_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// --- READ ------------------------------
// the page's state, as it is right now.
function get_state_fun(): HUGGIES_DAO_PAGE_STATE {
  return state;
}
// ========================================
// --- SUBSCRIBE -------------------------
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
// public surface, in one place so components have a single import.
export const HUGGIES_DAO_PAGE_STATE = {
  get: get_state_fun,
  set: set_state_fun,
  subscribe: subscribe_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
