// ========================================
// API_HUGGIES_SESSION_ROTATE_POST
// POST /api/huggies/session/rotate — give an account a NEW session key.
//
// the old key stops working at once and the new one takes its place.
//
// the request carries the account's SIGNED MESSAGE, not the old key: the
// old key is what a thief has, so a rotation that only needed the old
// key could be done by the thief. the signed message proves the owner
// still holds the account's NEAR key.
//
// no wallet popup is needed — the browser already holds the signed
// message in its local storage from the sign-in.
//
// the caller passes the session token so the backend can be sure the
// rotation is for the account the key belongs to.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type {
  HUGGIES_SESSION_KEY,
  HUGGIES_SESSIONS_REQUEST,
} from "../types/huggies_sessions";

export async function api_huggies_session_rotate_post(
  base_url: string,
  body: HUGGIES_SESSIONS_REQUEST,
  options: REQUEST_OPTIONS = {},
): Promise<HUGGIES_SESSION_KEY> {
  if (!Array.isArray(body.accounts) || body.accounts.length === 0) {
    throw new Error(
      "api_huggies_session_rotate_post failed: invalid_request: a rotation needs one signed account",
    );
  }
  if (body.accounts.length > 1) {
    throw new Error(
      "api_huggies_session_rotate_post failed: invalid_request: a rotation is for one account at a time",
    );
  }

  const json = await api_call<HUGGIES_SESSION_KEY>({
    base_url,
    key: "api_huggies_session_rotate",
    method: "POST",
    body,
    options,
    label: "HUGGIES SESSION ROTATE POST",
    fallback: "api_huggies_session_rotate_post failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.accountId !== "string" ||
    typeof json.sessionKey !== "string"
  ) {
    throw new Error(
      "api_huggies_session_rotate_post failed: invalid_response: expected a json object with accountId and sessionKey",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
