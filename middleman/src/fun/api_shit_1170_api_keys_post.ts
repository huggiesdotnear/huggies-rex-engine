// ========================================
// API_SHIT_1170_API_KEYS_POST
// POST /api/shit-1170/api-keys — turn signed messages into api keys.
//
// the browser sends every account it holds a signature for; the backend
// verifies each one and answers with ONE KEY PER ACCOUNT.
//
// same-origin call, so the browser needs no cors. a non-2xx or a body
// that is not the expected json object throws a readable Error.
//
// --- WHY --- the request is checked HERE and not only on the server:
// an empty accounts list is a programming mistake, and catching it
// before the request means the caller gets a clear message instead of a
// 400 from the wire.
//
// --- WHY --- the answer's key field is `apiKey`: the credential in it
// is not a browser session. the user signs in once and hands the key
// to an agent, and the agent holds it as a bearer token for as long as
// it lives.
// ========================================

import { api_call } from "../stuff/api_call";
import type {
  SHIT_1170_API_KEYS_REQUEST,
  SHIT_1170_API_KEYS_RESPONSE,
} from "../types/shit_1170_api_keys";

export async function api_shit_1170_api_keys_post(
  base_url: string,
  body: SHIT_1170_API_KEYS_REQUEST,
): Promise<SHIT_1170_API_KEYS_RESPONSE> {
  if (!Array.isArray(body.accounts) || body.accounts.length === 0) {
    throw new Error(
      "api_shit_1170_api_keys_post failed: invalid_request: at least one signed account is required",
    );
  }

  const json = await api_call<SHIT_1170_API_KEYS_RESPONSE>({
    base_url,
    key: "api_shit_1170_api_keys",
    method: "POST",
    body,
    label: "SHIT_1170 API KEYS POST",
    fallback: "api_shit_1170_api_keys_post failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    !Array.isArray(json.keys)
  ) {
    throw new Error(
      "api_shit_1170_api_keys_post failed: invalid_response: expected a json object with a keys array",
    );
  }

  // every entry has to carry an account id and a key — the caller walks
  // the list and pairs each key with its account.
  for (const entry of json.keys) {
    if (
      typeof entry?.accountId !== "string" ||
      typeof entry?.apiKey !== "string"
    ) {
      throw new Error(
        "api_shit_1170_api_keys_post failed: invalid_response: every key entry needs an accountId and an apiKey",
      );
    }
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
