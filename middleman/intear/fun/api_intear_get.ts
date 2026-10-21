// ========================================
// API_INTEAR_GET
// the single fetch+log+error helper every `fun/api_intear_*` wrapper
// goes through. the goal: one place to change if we ever want
// retries, timeouts, or different log formatting.
//
// flow:
//   1. build url = INTEAR_BASE_URL + path + build_query(params)
//   2. fetch GET with an Accept header
//   3. on non-2xx: intear_parse_error logs and throws
//   4. on 2xx:    parse json, log the framed success block, return it
//
// `label` is the human-readable name in the success log block (e.g.
// "INTEAR TOKENS GET"). `fallback` is the prefix on the thrown error.
// nothing is redacted — these responses are public market data, so
// the full body is logged as-is.
// ========================================

import { INTEAR_BASE_URL } from "../stuff/intear_base_url";
import { intear_build_query } from "../stuff/intear_build_query";
import { intear_parse_error } from "../stuff/intear_parse_error";
import type { INTEAR_ENDPOINT_KEY } from "../stuff/intear_endpoint_paths";
import { INTEAR_ENDPOINT_PATHS } from "../stuff/intear_endpoint_paths";

export interface API_INTEAR_GET_PARAMS {
  key: INTEAR_ENDPOINT_KEY;
  // `object` not `Record<string, unknown>`: the tool box types are
  // interfaces, which have no index signature, so Record would reject
  // every one of them. build_query only reads own enumerable keys.
  params?: object;
  label: string;
  fallback: string;
}

export async function api_intear_get<t = unknown>({
  key,
  params = {},
  label,
  fallback,
}: API_INTEAR_GET_PARAMS): Promise<t> {
  const path = INTEAR_ENDPOINT_PATHS[key];
  const query = intear_build_query(params as Record<string, unknown>);
  const url =
    query.length > 0
      ? `${INTEAR_BASE_URL}${path}?${query}`
      : `${INTEAR_BASE_URL}${path}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const error = await intear_parse_error(response, fallback);
    console.log("=============================");
    console.log(` ${label} FAILED on:`, url);
    console.log(
      "RESPONSE STATUS:",
      `${response.status} - ${response.statusText}`,
    );
    console.log("ERROR:", error.message);
    console.log("=============================");
    throw error;
  }

  const json = (await response.json()) as t;
  // framed success log, same shape as the graupelos middleman so a
  // grep for `=====` finds every api call in one place.
  console.log("=============================");
  console.log(` ${label} via GET on:`, url);
  console.log(
    "RESPONSE STATUS:",
    `${response.status} - ${response.statusText}`,
  );
  // --- WHY --- stringify before logging. console.log inspects objects
  // with util.inspect, which collapses long nested arrays to
  // `[Array ...]` — a 145-row balances response printed as 145
  // placeholders. JSON.stringify always shows the real values.
  console.log("RESPONSE:", JSON.stringify(json, null, 2));
  console.log("=============================");
  return json;
}
// ========================================
// copyright 2026 by sleet.near
