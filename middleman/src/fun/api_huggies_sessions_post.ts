// ========================================
// API_HUGGIES_SESSIONS_POST
// POST /api/huggies/sessions — turn signed messages into session keys.
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
    !Array.isArray(json.keys)
  ) {
    throw new Error(
      "api_huggies_sessions_post failed: invalid_response: expected a json object with a keys array",
    );
  }

  // every entry has to carry an account id and a key — the caller walks
  // the list and pairs each key with its account.
  for (const entry of json.keys) {
    if (
      typeof entry?.accountId !== "string" ||
      typeof entry?.sessionKey !== "string"
    ) {
      throw new Error(
        "api_huggies_sessions_post failed: invalid_response: every key entry needs an accountId and a sessionKey",
      );
    }
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
