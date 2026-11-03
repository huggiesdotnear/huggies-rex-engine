// ========================================
// API_SHIT_1170_PING_GET
// GET /api/shit-1170/ping — the liveness check of our own backend.
//
// this route is OURS: it is not a proxy for another api, so it is
// named after us, the way /api/shit-1170/* is named after us in the
// url (see DOCS/ROUTES.md).
//
// same-origin call, so the browser needs no cors. a non-2xx or a body
// that is not the expected json object throws a readable Error.
// ========================================

import { api_call } from "../stuff/api_call";
import type { SHIT_1170_PING } from "../types/shit_1170_ping";

export async function api_shit_1170_ping_get(
  base_url: string,
): Promise<SHIT_1170_PING> {
  const json = await api_call<SHIT_1170_PING>({
    base_url,
    key: "api_shit_1170_ping",
    method: "GET",
    label: "SHIT_1170 PING GET",
    fallback: "api_shit_1170_ping_get failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof (json as SHIT_1170_PING).ok !== "boolean" ||
    typeof (json as SHIT_1170_PING).app !== "string"
  ) {
    throw new Error(
      "api_shit_1170_ping_get failed: invalid_response: expected a json object with ok and app",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
