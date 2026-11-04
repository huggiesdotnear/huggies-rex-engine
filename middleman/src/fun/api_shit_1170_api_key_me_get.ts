// ========================================
// API_SHIT_1170_API_KEY_ME_GET
// GET /api/shit-1170/api-key/me — which account does this api key
// belong to.
//
// the first route that REQUIRES the api key. the key travels in the
// `x-api-key` header, and the answer is the account the key belongs
// to.
//
// the caller passes the key through `options.api_key`. a caller that
// has no key gets a 401, and the error is thrown like any other.
//
// --- WHY --- the key is a PARAMETER and not something the wrapper
// fetches: the middleman is a plain client with no browser state, so it
// cannot know the user's key. the frontend attaches it — see
// frontend/lib/ts/shared/api_key_token.ts.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type { SHIT_1170_API_KEY_ME } from "../types/shit_1170_api_keys";

export async function api_shit_1170_api_key_me_get(
  base_url: string,
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_API_KEY_ME> {
  const json = await api_call<SHIT_1170_API_KEY_ME>({
    base_url,
    key: "api_shit_1170_api_key_me",
    method: "GET",
    options,
    label: "SHIT_1170 API KEY ME GET",
    fallback: "api_shit_1170_api_key_me_get failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.accountId !== "string"
  ) {
    throw new Error(
      "api_shit_1170_api_key_me_get failed: invalid_response: expected a json object with an accountId",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
