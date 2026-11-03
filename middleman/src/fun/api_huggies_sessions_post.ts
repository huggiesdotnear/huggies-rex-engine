// ========================================
// API_HUGGIES_SESSIONS_POST
// POST /api/huggies/sessions — turn signed messages into a session key.
//
// the browser sends every account it holds a signature for; the backend
// verifies each one and answers with the ONE key the user has.
//
// same-origin call, so the browser needs no cors. a non-2xx or a body
// that is not the expected json object throws a readable Error.
//
// --- WHY --- the request is checked HERE and not only on the server:
// an empty accounts list is a programming mistake, and catching it
// before the request means the caller gets a clear message instead of a
// 400 from the wire.
// ========================================

import { api_call } from "../stuff/api_call";
import type {
  HUGGIES_SESSIONS_REQUEST,
  HUGGIES_SESSIONS_RESPONSE,
} from "../types/huggies_sessions";

export async function api_huggies_sessions_post(
  base_url: string,
  body: HUGGIES_SESSIONS_REQUEST,
): Promise<HUGGIES_SESSIONS_RESPONSE> {
  if (!Array.isArray(body.accounts) || body.accounts.length === 0) {
    throw new Error(
      "api_huggies_sessions_post failed: invalid_request: at least one signed account is required",
    );
  }

  const json = await api_call<HUGGIES_SESSIONS_RESPONSE>({
    base_url,
    key: "api_huggies_sessions",
    method: "POST",
    body,
    label: "HUGGIES SESSIONS POST",
    fallback: "api_huggies_sessions_post failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.sessionKey !== "string" ||
    typeof json.userId !== "string" ||
    !Array.isArray(json.accounts)
  ) {
    throw new Error(
      "api_huggies_sessions_post failed: invalid_response: expected a json object with sessionKey, userId and accounts",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
