// ========================================
// API_HUGGIES_SESSION_ME_GET
// GET /api/huggies/session/me — who does this session key belong to.
//
// the first route that REQUIRES the session key. the key travels in the
// `x-session-token` header, and the backend answers with the user the
// key belongs to.
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

export interface HUGGIES_SESSION_ME {
  userId: string;
  accounts: string[];
  createdAt: number;
}

export async function api_huggies_session_me_get(
  base_url: string,
  options: REQUEST_OPTIONS = {},
): Promise<HUGGIES_SESSION_ME> {
  const json = await api_call<HUGGIES_SESSION_ME>({
    base_url,
    key: "api_huggies_session_me",
    method: "GET",
    options,
    label: "HUGGIES SESSION ME GET",
    fallback: "api_huggies_session_me_get failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.userId !== "string" ||
    !Array.isArray(json.accounts)
  ) {
    throw new Error(
      "api_huggies_session_me_get failed: invalid_response: expected a json object with userId and accounts",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
