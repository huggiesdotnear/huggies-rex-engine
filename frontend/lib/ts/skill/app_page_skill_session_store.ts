// ========================================
// the skill page's SESSION store: the accounts the browser holds and
// the key each one has.
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
// --- WHY --- the ACCOUNTS come from the browser and the KEYS come from
// the backend: the browser knows which accounts it holds a signed
// message for, and the backend knows the key each account has.
import { SHIT_1170_AUTH } from "../shared/auth_status";
import { SHIT_1170_AUTH_SESSIONS } from "../shared/auth_sessions";
import { SHIT_1170_SESSION } from "../shared/session";
import { app_page_skill_session_rotate_fun } from "./app_page_skill_session_rotate";
// ========================================
// --- TYPES ------------------------------
// one account's row in the card.
export interface SHIT_1170_APP_PAGE_SKILL_ACCOUNT {
  // the account id.
  account_id: string;
  // the account's session key, or null when the backend has not issued
  // one yet.
  session_key: string | null;
  // true for the account the app is currently acting as.
  is_active: boolean;
}

// what the card shows.
export interface SHIT_1170_APP_PAGE_SKILL_SESSION_DATA {
  // one row per signed-in account.
  accounts: SHIT_1170_APP_PAGE_SKILL_ACCOUNT[];
  // true while the keys are being fetched.
  loading: boolean;
  // true while a rotation is running.
  rotating: boolean;
  // the message from the last failure, or null.
  error: string | null;
}
// ========================================
// --- STATE ------------------------------
// null until the first load finishes. components render nothing until
// then.
let data: SHIT_1170_APP_PAGE_SKILL_SESSION_DATA | null = null;
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
// fill the data: the accounts from the browser, the keys from the
// backend.
async function load_fun(): Promise<void> {
  const account_ids = SHIT_1170_AUTH_SESSIONS.list_account_ids();
  const active_id = SHIT_1170_AUTH.get_account_id();
  data = {
    accounts: account_ids.map((account_id) => ({
      account_id,
      session_key: SHIT_1170_SESSION.get_session_key(account_id),
      is_active: account_id === active_id,
    })),
    loading: account_ids.length > 0,
    rotating: false,
    error: null,
  };
  notify_fun();

  // the keys are fetched only when there are accounts to fetch them
  // with. without an account there is nothing to verify, so there is
  // no key.
  if (account_ids.length === 0) {
    data = {
      accounts: [],
      loading: false,
      rotating: false,
      error: null,
    };
    notify_fun();
    return;
  }

  try {
    await SHIT_1170_SESSION.load();
    data = {
      accounts: account_ids.map((account_id) => ({
        account_id,
        session_key: SHIT_1170_SESSION.get_session_key(account_id),
        is_active: account_id === active_id,
      })),
      loading: false,
      rotating: false,
      error: null,
    };
  } catch (err) {
    data = {
      accounts: account_ids.map((account_id) => ({
        account_id,
        session_key: SHIT_1170_SESSION.get_session_key(account_id),
        is_active: account_id === active_id,
      })),
      loading: false,
      rotating: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  notify_fun();
}
// ========================================
// --- ROTATE ----------------------------
// give one account a NEW key.
//
// --- WHY --- the account's signed message is sent with the request, and
// not the old key: the old key is what a thief would have, and a
// rotation that only needed the old key could be done by the thief. the
// signed message proves the owner still holds the account's NEAR key.
//
// --- WHY --- no wallet popup: the browser already holds the signed
// message in its local storage from the sign-in, and the signature covers
// the message + nonce + recipient.
async function rotate_fun(account_id: string): Promise<void> {
  if (data === null) return;
  data = { ...data, rotating: true, error: null };
  notify_fun();
  try {
    const result = await app_page_skill_session_rotate_fun(account_id);
    // the new key replaces the old one in memory.
    SHIT_1170_SESSION.set_session_key(account_id, result.session_key);
    data = {
      ...data,
      accounts: data.accounts.map((account) =>
        account.account_id === account_id
          ? { ...account, session_key: result.session_key }
          : account,
      ),
      rotating: false,
      error: null,
    };
  } catch (err) {
    data = {
      ...data,
      rotating: false,
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
  const unsubscribe = SHIT_1170_AUTH.subscribe(() => {
    void SHIT_1170_APP_PAGE_SKILL_SESSION_STORE.load();
  });
  // the subscription lives as long as the page does, so it is never
  // unsubscribed. the module is loaded once per document.
  void unsubscribe;
}
// ========================================
// --- READ ------------------------------
function get_fun(): SHIT_1170_APP_PAGE_SKILL_SESSION_DATA | null {
  return data;
}
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_SKILL_SESSION_STORE = {
  load: load_fun,
  rotate: rotate_fun,
  subscribe: subscribe_fun,
  get: get_fun,
  watch: watch_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
