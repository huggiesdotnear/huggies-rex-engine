// ========================================
// the skill page's ROTATE load: give an account a NEW session key.
//
// the old key stops working at once. the new one takes its place.
//
// --- WHY --- the account's SIGNED MESSAGE is sent and not the old key:
// the old key is what a thief would have. a rotation that only needed
// the old key could be done by the thief, and the owner would be locked
// out while the thief kept access. the signed message proves the owner
// still holds the account's NEAR key.
//
// --- WHY --- no wallet popup is needed: the browser already holds the
// signed message in its local storage from the sign-in, and the
// signature covers the message + nonce + recipient. the reader asked
// for the rotation on purpose.
//
// --- WHY --- the session token rides along: the backend uses it to be
// sure the rotation is for the account whose key it holds.
import { api_shit_1170_session_rotate_post } from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_AUTH_SESSIONS } from "../shared/auth_sessions";
import { SHIT_1170_BASE_URL } from "../shared/base_url";
import { session_options_fun } from "../shared/session_token";
// ========================================
// --- TYPES ------------------------------
// the new key for one account.
export interface SHIT_1170_APP_PAGE_SKILL_ROTATED {
  account_id: string;
  session_key: string;
}
// ========================================
// --- LOAD ------------------------------
// rotate one account's key.
export async function app_page_skill_session_rotate_fun(
  account_id: string,
): Promise<SHIT_1170_APP_PAGE_SKILL_ROTATED> {
  // the browser's own signed message for this account.
  const session = SHIT_1170_AUTH_SESSIONS.get_session(account_id);
  if (session === null) {
    throw new Error(`${account_id} is not signed in on this device`);
  }
  const accounts = [
    {
      accountId: session.accountId,
      publicKey: session.publicKey,
      signature: session.signature,
      message: session.message,
      nonce: session.nonce,
      recipient: session.recipient,
    },
  ];
  const options = await session_options_fun(true, account_id);
  const result = await api_shit_1170_session_rotate_post(
    SHIT_1170_BASE_URL,
    { accounts },
    options,
  );
  return {
    account_id: result.accountId,
    session_key: result.sessionKey,
  };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
