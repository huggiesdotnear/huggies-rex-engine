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

import { HUGGIES_BASE_URL } from "../stuff/huggies_base_url";
import { HUGGIES_ENDPOINT_PATHS } from "../stuff/huggies_endpoint_paths";
import { huggies_parse_error } from "../stuff/huggies_parse_error";
import type { HUGGIES_PING } from "../types/huggies_ping";

export async function api_huggies_ping_get(): Promise<HUGGIES_PING> {
  const url = `${HUGGIES_BASE_URL}${HUGGIES_ENDPOINT_PATHS.api_huggies_ping}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const error = await huggies_parse_error(
      response,
      "api_huggies_ping_get failed",
    );
    console.log("=============================");
    console.log(" HUGGIES PING GET FAILED on:", url);
    console.log(
      "RESPONSE STATUS:",
      `${response.status} - ${response.statusText}`,
    );
    console.log("ERROR:", error.message);
    console.log("=============================");
    throw error;
  }

  const json: unknown = await response.json();
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

  console.log("=============================");
  console.log(" HUGGIES PING GET via GET on:", url);
  console.log(
    "RESPONSE STATUS:",
    `${response.status} - ${response.statusText}`,
  );
  console.log("RESPONSE:", json);
  console.log("=============================");
  return json as HUGGIES_PING;
}
// ========================================
// copyright 2026 by sleet.near
