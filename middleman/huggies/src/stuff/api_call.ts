// ========================================
// API_CALL
// the single fetch+log+error helper every wrapper in middleman/huggies
// goes through. the goal: one place to change if we ever want to add
// retries, timeouts, tracing, or different log formatting.
//
// the url is base_url + ENDPOINT_PATHS[key], plus ?key=value&... when
// `query` is supplied. `body`, when supplied, is JSON.stringified and
// sent with content-type: application/json — omit for GET /
// DELETE-with-no-body. `options` carries the session token.
//
// --- WHY --- the base url is a parameter, not a constant. the frontend
// passes the origin of the page it is served from; a bin passes
// whatever backend it was told to talk to. a constant baked in would
// be "" outside a browser, so a bin could never reach the backend.
//
// --- WHY --- the query builder drops undefined/null/"" but keeps false
// and 0. our routes read those two as real values, so dropping them
// would silently change what the route does.
//
// the `url` + `method` are passed through to parse_error() on failure
// so the error log block can show exactly which request blew up.
// ========================================

import { ENDPOINT_PATHS, type EndpointKey } from "./endpoint_paths";
import { parse_error } from "./parse_error";
import { build_headers, type REQUEST_OPTIONS } from "./request_options";

export interface API_CALL_PARAMS {
  base_url: string;
  key: EndpointKey;
  query?: Record<string, string | number | boolean | undefined>;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  options?: REQUEST_OPTIONS;
  // success log label. e.g. "TREZU TREASURIES GET".
  label: string;
  // error message prefix. e.g. "api_trezu_treasuries_get failed".
  fallback: string;
}

export async function api_call<T = unknown>({
  base_url,
  key,
  query,
  method,
  body,
  options = {},
  label,
  fallback,
}: API_CALL_PARAMS): Promise<T> {
  // ========================================
  let url = `${base_url}${ENDPOINT_PATHS[key]}`;
  if (query) {
    const entries = Object.entries(query).filter(
      (entry): entry is [string, string | number | boolean] =>
        entry[1] !== undefined && entry[1] !== null && entry[1] !== "",
    );
    if (entries.length > 0) {
      const qs = new URLSearchParams(
        Object.fromEntries(
          entries.map(([k, v]) => [k, encode_query_value_fun(v)]),
        ),
      ).toString();
      url = `${url}?${qs}`;
    }
  }

  const init: RequestInit = {
    method,
    headers: build_headers(
      options,
      body !== undefined ? { "content-type": "application/json" } : {},
    ),
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  if (!res.ok) {
    throw await parse_error(res, fallback, {
      url,
      method,
      label,
      // init.body is the post-JSON.stringify form, exactly
      // what hit the wire. undefined for body-less calls
      // (GET, DELETE), which parse_error then omits from
      // the banner.
      request_body: init.body,
    });
  }

  const json = (await res.json()) as T;
  // ========================================
  console.log("=============================");
  console.log(` ${label} via ${method} on:`, url);
  console.log("RESPONSE STATUS:", `${res.status} - ${res.statusText}`);
  console.log("RESPONSE:", json);
  console.log("=============================");
  // ========================================
  return json;
}

// ========================================
// render one query value. booleans become "true"/"false", numbers
// keep their literal form, everything else is stringified.
function encode_query_value_fun(value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "null";
  }
  return String(value);
}
// ========================================
// copyright 2026 by sleet.near
