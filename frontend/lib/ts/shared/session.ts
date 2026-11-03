// ========================================
// the backend session: the keys of the signed-in accounts.
//
// the browser holds the signed messages in localStorage. this module
// sends them to our backend, which verifies them and answers with ONE
// KEY PER ACCOUNT. the keys are then kept here, in memory, and every
// request that needs one picks it up from here.
//
// --- WHY --- the keys are kept in MEMORY and not in localStorage: a key
// is a bearer token — whoever holds it IS that account. putting it in
// localStorage would put it where a script on the page can read it, and
// where it would survive forever after the tab is closed.
//
// --- WHY --- ONE KEY PER ACCOUNT: an account has exactly one key, and
// the key can be narrowed to that one wallet. the same account on
// another device gets the SAME key back, so a second device does not
// invalidate the first.
//
// --- WHY --- NOTHING SECRET IS SENT: the browser sends the SIGNED
// message — the account id, the PUBLIC key, the signature, and the
// message + nonce + recipient that were signed. the user's NEAR
// private key stays in the wallet and never reaches us or the backend.
// ========================================
import { api_shit_1170_sessions_post } from "@huggies/shit-1170-rex-engine-middleman";
import type { SHIT_1170_SIGNED_ACCOUNT } from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_AUTH_SESSIONS } from "./auth_sessions";
import { SHIT_1170_BASE_URL } from "./base_url";
// ========================================
// --- TYPES ------------------------------
// one account's key.
export interface SHIT_1170_SESSION_KEY_ENTRY {
  account_id: string;
  session_key: string;
}
// ========================================
// --- STATE ------------------------------
// the keys, by account id.
const session_keys: Map<string, string> = new Map();
// true while a request for the keys is in flight, so two callers do not
// make two requests.
let loading = false;
// the keys we are waiting for, so a caller can wait on them.
let pending: Promise<SHIT_1170_SESSION_KEY_ENTRY[]> | null = null;
// ========================================
// --- HELPERS ----------------------------
// every signed account the browser holds, in the shape the backend
// wants.
//
// --- WHY --- the accounts are read from the SESSION MAP and not from
// the wallet: the wallet is not always available (a page opened without
// the extension, a wallet that is locked), and the map is what the
// browser already decided to keep.
function collect_signed_accounts_fun(): SHIT_1170_SIGNED_ACCOUNT[] {
  const sessions = SHIT_1170_AUTH_SESSIONS.load_sessions();
  const out: SHIT_1170_SIGNED_ACCOUNT[] = [];
  for (const [account_id, session] of Object.entries(sessions)) {
    out.push({
      accountId: session.accountId,
      publicKey: session.publicKey,
      signature: session.signature,
      message: session.message,
      nonce: session.nonce,
      recipient: session.recipient,
    });
  }
  return out;
}
// ========================================
// --- LOAD ------------------------------
// get the keys, fetching them if the browser does not have them yet.
//
// --- WHY --- the keys are fetched ONCE and reused: every page that needs
// a key asks this module, and the module answers from memory when it
// already has the keys. the browser's signed messages only go to the
// backend when a key is missing.
async function load_fun(): Promise<SHIT_1170_SESSION_KEY_ENTRY[]> {
  if (session_keys.size > 0) return entries_fun();
  if (loading && pending !== null) return pending;

  const accounts = collect_signed_accounts_fun();
  if (accounts.length === 0) return [];

  loading = true;
  pending = (async () => {
    try {
      const result = await api_shit_1170_sessions_post(SHIT_1170_BASE_URL, {
        accounts,
      });
      for (const entry of result.keys) {
        session_keys.set(entry.accountId, entry.sessionKey);
      }
      return entries_fun();
    } catch (err) {
      // --- WHY --- a failure is logged and not thrown: a page that
      // needs a key must still render when the backend is down or the
      // signatures are stale. the caller gets nothing and shows what it
      // can.
      console.warn("[session] the session keys could not be fetched", err);
      return [];
    } finally {
      loading = false;
      pending = null;
    }
  })();
  return pending;
}
// ========================================
// --- READ ------------------------------
// the keys we have, as a list.
function entries_fun(): SHIT_1170_SESSION_KEY_ENTRY[] {
  return [...session_keys.entries()].map(([account_id, session_key]) => ({
    account_id,
    session_key,
  }));
}

// one account's key, or null.
function get_session_key_fun(account_id: string): string | null {
  return session_keys.get(account_id) ?? null;
}

// every account we hold a key for.
function list_session_keys_fun(): SHIT_1170_SESSION_KEY_ENTRY[] {
  return entries_fun();
}

// the session key, fetching it if it is not there yet.
//
// --- WHY --- this is the function a request that NEEDS a key calls: it
// returns the key whether it was already known or had to be fetched, so
// a caller never has to know which it is.
async function get_or_fetch_session_key_fun(
  account_id: string,
): Promise<string | null> {
  const existing = session_keys.get(account_id);
  if (existing !== undefined) return existing;
  await load_fun();
  return session_keys.get(account_id) ?? null;
}
// ========================================
// --- SET -------------------------------
// remember a key we were given, e.g. after a rotation.
function set_session_key_fun(account_id: string, session_key: string): void {
  session_keys.set(account_id, session_key);
}
// ========================================
// --- RESET -----------------------------
// forget the keys.
//
// --- WHY --- this is called when the user signs out or removes an
// account: a key belongs to an account, and when the account is gone the
// key must not still be in memory.
function reset_fun(): void {
  session_keys.clear();
  loading = false;
  pending = null;
}

// forget ONE account's key.
function reset_account_fun(account_id: string): void {
  session_keys.delete(account_id);
}
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_SESSION = {
  load: load_fun,
  get_session_key: get_session_key_fun,
  list_session_keys: list_session_keys_fun,
  get_or_fetch_session_key: get_or_fetch_session_key_fun,
  set_session_key: set_session_key_fun,
  reset: reset_fun,
  reset_account: reset_account_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
