// ========================================
// the backend session: the ONE key the signed-in user has.
//
// the browser holds the signed messages in localStorage. this module
// sends them to our backend, which verifies them and answers with the
// user's one session key. the key is then kept here, in memory, and
// every request that needs it picks it up from here.
//
// --- WHY --- the key is kept in MEMORY and not in localStorage: the key
// is a bearer token — whoever holds it IS the user. putting it in
// localStorage would put it where a script on the page can read it, and
// where it would survive forever after the tab is closed.
//
// --- WHY --- the key is ONE per user and not one per account: the user
// is the person, and the person has one key. the backend hands back the
// same key for the same user on every device, so a second device does
// not invalidate the first.
//
// --- WHY --- the session is fetched ONCE and reused: every page that
// needs a session key asks this module, and the module answers from
// memory when it already has the key. the browser's signed messages
// only go to the backend when there is no key yet.
//
// --- WHY --- NOTHING SECRET IS SENT: the browser sends the SIGNED
// message — the account id, the PUBLIC key, the signature, and the
// message + nonce + recipient that were signed. the user's NEAR
// private key stays in the wallet and never reaches us or the backend.
// ========================================
import { api_huggies_sessions_post } from "@huggies/huggies-rex-engine-middleman";
import type { HUGGIES_SIGNED_ACCOUNT } from "@huggies/huggies-rex-engine-middleman";
import { HUGGIES_AUTH_SESSIONS } from "./auth_sessions";
import { HUGGIES_BASE_URL } from "./base_url";
// ========================================
// --- STATE ------------------------------
// the user's session key, or null when there is none yet.
let session_key: string | null = null;
// the user the key belongs to.
let user_id: string | null = null;
// true while a request for the key is in flight, so two callers do not
// make two requests.
let loading = false;
// the key we are waiting for, so a caller can wait on it.
let pending: Promise<string | null> | null = null;
// ========================================
// --- HELPERS ----------------------------
// every signed account the browser holds, in the shape the backend
// wants.
//
// --- WHY --- the accounts are read from the SESSION MAP and not from
// the wallet: the wallet is not always available (a page opened without
// the extension, a wallet that is locked), and the map is what the
// browser already decided to keep.
function collect_signed_accounts_fun(): HUGGIES_SIGNED_ACCOUNT[] {
  const sessions = HUGGIES_AUTH_SESSIONS.load_sessions();
  const out: HUGGIES_SIGNED_ACCOUNT[] = [];
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
// get the session key, fetching it if the browser does not have it yet.
async function load_fun(): Promise<string | null> {
  if (session_key !== null) return session_key;
  if (loading && pending !== null) return pending;

  const accounts = collect_signed_accounts_fun();
  if (accounts.length === 0) return null;

  loading = true;
  pending = (async () => {
    try {
      const result = await api_huggies_sessions_post(HUGGIES_BASE_URL, {
        accounts,
      });
      session_key = result.sessionKey;
      user_id = result.userId;
      return session_key;
    } catch (err) {
      // --- WHY --- a failure is logged and not thrown: a page that
      // needs a session key must still render when the backend is down
      // or the signatures are stale. the caller gets null and shows what
      // it can.
      console.warn("[session] the session key could not be fetched", err);
      return null;
    } finally {
      loading = false;
      pending = null;
    }
  })();
  return pending;
}
// ========================================
// --- READ ------------------------------
// the session key, or null. it does NOT fetch: a component that only
// displays the key reads this, and the page's load fetches it.
function get_session_key_fun(): string | null {
  return session_key;
}

// the user the key belongs to, or null.
function get_user_id_fun(): string | null {
  return user_id;
}

// the session key, fetching it if it is not there yet.
//
// --- WHY --- this is the function a request that NEEDS the key calls:
// it returns the key whether it was already known or had to be fetched,
// so a caller never has to know which it is.
async function get_or_fetch_session_key_fun(): Promise<string | null> {
  return load_fun();
}
// ========================================
// --- RESET -----------------------------
// forget the session key.
//
// --- WHY --- this is called when the user signs out or removes the
// active account: the key belongs to the USER, and when the user is
// gone the key must not still be in memory.
function reset_fun(): void {
  session_key = null;
  user_id = null;
  loading = false;
  pending = null;
}
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_SESSION = {
  load: load_fun,
  get_session_key: get_session_key_fun,
  get_user_id: get_user_id_fun,
  get_or_fetch_session_key: get_or_fetch_session_key_fun,
  reset: reset_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
