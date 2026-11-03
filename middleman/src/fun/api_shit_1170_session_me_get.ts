// ========================================
// API_SHIT_1170_SESSION_ME_GET
// GET /api/shit-1170/session/me — which account does this session key
// belong to.
//
// the first route that REQUIRES the session key. the key travels in the
// `x-session-token` header, and the answer is the account the key
// belongs to.
//
// the caller passes the key through `options.session_token`. a caller
// that has no key gets a 401, and the error is thrown like any other.
//
// --- WHY --- the key is a PARAMETER and not something the wrapper
// fetches: the middleman is a plain client with no browser state, so it
// cannot know the user's key. the frontend attaches it — see
// frontend/lib/ts/shared/session_token.ts.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type { SHIT_1170_SESSION_ME } from "../types/shit_1170_sessions";

export async function api_shit_1170_session_me_get(
  base_url: string,
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_SESSION_ME> {
  const json = await api_call<SHIT_1170_SESSION_ME>({
    base_url,
    key: "api_shit_1170_session_me",
    method: "GET",
    options,
    label: "SHIT_1170 SESSION ME GET",
    fallback: "api_shit_1170_session_me_get failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.accountId !== "string"
  ) {
    throw new Error(
      "api_shit_1170_session_me_get failed: invalid_response: expected a json object with an accountId",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
