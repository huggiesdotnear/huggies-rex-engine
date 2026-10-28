// ========================================
// API_HUGGIES_PING_GET
// GET /api/huggies/ping — the liveness check of our own backend.
//
// this route is OURS: it is not a proxy for another api, so it is
// named after us, the way /api/huggies/* is named after us in the
// url (see DOCS/ROUTES.md).
//
// same-origin call, so the browser needs no cors. a non-2xx or a body
// that is not the expected json object throws a readable Error.
// ========================================

import { api_call } from "../stuff/api_call";
import type { HUGGIES_PING } from "../types/huggies_ping";

export async function api_huggies_ping_get(
  base_url: string,
): Promise<HUGGIES_PING> {
  const json = await api_call<HUGGIES_PING>({
    base_url,
    key: "api_huggies_ping",
    method: "GET",
    label: "HUGGIES PING GET",
    fallback: "api_huggies_ping_get failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof (json as HUGGIES_PING).ok !== "boolean" ||
    typeof (json as HUGGIES_PING).app !== "string"
  ) {
    throw new Error(
      "api_huggies_ping_get failed: invalid_response: expected a json object with ok and app",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
