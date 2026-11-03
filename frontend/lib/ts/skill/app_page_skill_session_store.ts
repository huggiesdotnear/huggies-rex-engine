// ========================================
// the skill page's SESSION store: the accounts the browser holds and the
// one session key they belong to.
//
// the store has the same shape as every page's store: plain module
// state, a subscribe/unsubscribe pair, a notify that a throwing
// subscriber cannot break, and a load that fills the data.
//
// --- WHY --- the store watches the AUTH state and not the page: the
// signed accounts can change under the page — the reader signs in, signs
// out, or removes an account — and the card has to follow. the auth
// module announces every one of those changes.
//
// --- WHY --- the card's data comes from TWO places and they are kept
// apart: the ACCOUNTS are the browser's own (read from the session
// map), and the SESSION KEY is the backend's (fetched with the signed
// messages). the backend never learns which accounts the browser holds
// until the card asks it to verify them.
// ========================================
import { HUGGIES_AUTH } from "../shared/auth_status";
import { HUGGIES_AUTH_SESSIONS } from "../shared/auth_sessions";
import { HUGGIES_SESSION } from "../shared/session";
import { app_page_skill_session_me_load_fun } from "./app_page_skill_session_me";
// ========================================
// --- TYPES ------------------------------
// what the card shows.
export interface HUGGIES_APP_PAGE_SKILL_SESSION_DATA {
  // the accounts the browser holds a signature for.
  accounts: string[];
  // the one session key the user has, or null when the backend has not
  // issued one yet.
  session_key: string | null;
  // the user the key belongs to.
  user_id: string | null;
  // true while the key is being fetched.
  loading: boolean;
  // the message from the last failure, or null.
  error: string | null;
}
// ========================================
// --- STATE ------------------------------
// null until the first load finishes. components render nothing until
// then.
let data: HUGGIES_APP_PAGE_SKILL_SESSION_DATA | null = null;
// true once the auth state is being watched.
let watching = false;
// the plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing cannot break the notify.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[app_page_skill_session_store] listener failed", err);
    }
  }
}
// register a re-render callback; returns an unsubscribe to clean up on unmount.
function subscribe_fun(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}
// ========================================
// --- LOAD ------------------------------
// fill the data: the accounts from the browser, the key from the
// backend.
async function load_fun(): Promise<void> {
  const accounts = HUGGIES_AUTH_SESSIONS.list_account_ids();
  const previous = data;
  data = {
    accounts,
    session_key: HUGGIES_SESSION.get_session_key(),
    user_id: HUGGIES_SESSION.get_user_id(),
    loading: true,
    error: null,
  };
  notify_fun();

  // the key is fetched only when there are accounts to fetch it with.
  // without an account there is nothing to verify, so there is no key.
  if (accounts.length === 0) {
    data = {
      accounts,
      session_key: null,
      user_id: null,
      loading: false,
      error: null,
    };
    notify_fun();
    return;
  }

  try {
    const session_key = await HUGGIES_SESSION.get_or_fetch_session_key();
    // --- WHY --- the backend is asked WHO WE ARE once the key is here:
    // it is the check that the key actually works. the key came from
    // the sessions route, and this route is a different one that looks
    // the key up by its hash — so a green answer here means the key
    // survives the round trip through the db.
    let user_id = HUGGIES_SESSION.get_user_id();
    let error =
      session_key === null
        ? "the backend could not issue a session key for these accounts"
        : null;
    if (session_key !== null) {
      try {
        const me = await app_page_skill_session_me_load_fun();
        user_id = me.user_id;
      } catch (err) {
        console.warn("[skill] the session key was refused by the backend", err);
        error = err instanceof Error ? err.message : String(err);
      }
    }
    data = {
      accounts: HUGGIES_AUTH_SESSIONS.list_account_ids(),
      session_key,
      user_id,
      loading: false,
      error,
    };
  } catch (err) {
    data = {
      accounts: HUGGIES_AUTH_SESSIONS.list_account_ids(),
      session_key: previous?.session_key ?? null,
      user_id: HUGGIES_SESSION.get_user_id(),
      loading: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  notify_fun();
}
// ========================================
// --- WATCH -----------------------------
// --- WHY --- the subscription is set up once: a second watch() would
// add a second listener, and the accounts would load twice per change.
function watch_fun(): void {
  if (watching) return;
  watching = true;
  const unsubscribe = HUGGIES_AUTH.subscribe(() => {
    void HUGGIES_APP_PAGE_SKILL_SESSION_STORE.load();
  });
  // the subscription lives as long as the page does, so it is never
  // unsubscribed. the module is loaded once per document.
  void unsubscribe;
}
// ========================================
// --- READ ------------------------------
function get_fun(): HUGGIES_APP_PAGE_SKILL_SESSION_DATA | null {
  return data;
}
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_SKILL_SESSION_STORE = {
  load: load_fun,
  subscribe: subscribe_fun,
  get: get_fun,
  watch: watch_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
