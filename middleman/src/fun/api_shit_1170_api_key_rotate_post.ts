// ========================================
// API_SHIT_1170_API_KEY_ROTATE_POST
// POST /api/shit-1170/api-key/rotate — give an account a NEW api key.
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
// the caller passes the api key so the backend can be sure the rotation
// is for the account the key belongs to.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type {
  SHIT_1170_API_KEY,
  SHIT_1170_API_KEYS_REQUEST,
} from "../types/shit_1170_api_keys";

export async function api_shit_1170_api_key_rotate_post(
  base_url: string,
  body: SHIT_1170_API_KEYS_REQUEST,
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_API_KEY> {
  if (!Array.isArray(body.accounts) || body.accounts.length === 0) {
    throw new Error(
      "api_shit_1170_api_key_rotate_post failed: invalid_request: a rotation needs one signed account",
    );
  }
  if (body.accounts.length > 1) {
    throw new Error(
      "api_shit_1170_api_key_rotate_post failed: invalid_request: a rotation is for one account at a time",
    );
  }

  const json = await api_call<SHIT_1170_API_KEY>({
    base_url,
    key: "api_shit_1170_api_key_rotate",
    method: "POST",
    body,
    options,
    label: "SHIT_1170 API KEY ROTATE POST",
    fallback: "api_shit_1170_api_key_rotate_post failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.accountId !== "string" ||
    typeof json.apiKey !== "string"
  ) {
    throw new Error(
      "api_shit_1170_api_key_rotate_post failed: invalid_response: expected a json object with accountId and apiKey",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
