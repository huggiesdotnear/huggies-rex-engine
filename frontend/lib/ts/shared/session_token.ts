// ========================================
// the session token, attached to a call automatically.
//
// a route that needs the session key should not have to remember to ask
// for it: the caller names the account and this module works out whether
// the key is needed and attaches it.
//
// --- WHY --- THE KEY IS FETCHED IN THE BACKGROUND: a page that needs
// the key should not have to wait for it before it can start its own
// work. so the key is asked for once and the call goes out without
// waiting — unless the route REQUIRES the key, in which case waiting is
// the point.
//
// --- WHY --- the header is `x-session-token`: the backend reads the
// session key from that header, and the middleman's `build_headers`
// already knows how to send it.
//
// --- WHY --- the key is NOT put in the url: a url ends up in logs, in
// the browser's history, and in the `referer` of the next page. a
// bearer token belongs in a header.
//
// --- WHY --- the account is a PARAMETER: an account has its own key, so
// a call that acts for one account carries that account's key. the
// default is the ACTIVE account, which is what a page means when it
// does not say otherwise.
import { HUGGIES_AUTH } from "./auth_status";
import { HUGGIES_SESSION } from "./session";
import type { REQUEST_OPTIONS } from "@huggies/huggies-rex-engine-middleman";
// ========================================
// --- TOKEN -----------------------------
// the session key for an account, fetched if it is not known yet.
//
// --- WHY --- `required` decides whether a missing key stops the call:
// a route that REQUIRES the key cannot work without it, so the call is
// not made at all. a route that only PREFERS the key goes out without
// it, and the backend answers as it would for an anonymous caller.
export async function session_token_fun(
  required: boolean,
  account_id?: string,
): Promise<string | undefined> {
  const target = account_id ?? HUGGIES_AUTH.get_account_id();
  if (target === null) {
    if (required) {
      throw new Error(
        "[session] this call needs a session key and no account is signed in",
      );
    }
    return undefined;
  }
  const session_key = await HUGGIES_SESSION.get_or_fetch_session_key(target);
  if (session_key !== null) return session_key;
  if (required) {
    throw new Error(
      "[session] this call needs a session key and the backend did not issue one",
    );
  }
  return undefined;
}
// ========================================
// --- OPTIONS ---------------------------
// the request options for a call, with the session key attached.
//
// --- WHY --- this is the entry point a route's wrapper uses: the
// wrapper says whether it needs the key, and this attaches it. a
// wrapper that forgets would send the request without a key and the
// backend would answer it as an anonymous caller — a quiet failure, and
// exactly the kind this helper exists to prevent.
export async function session_options_fun(
  required: boolean,
  account_id?: string,
): Promise<REQUEST_OPTIONS> {
  const session_token = await session_token_fun(required, account_id);
  if (session_token === undefined) return {};
  return { session_token };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
