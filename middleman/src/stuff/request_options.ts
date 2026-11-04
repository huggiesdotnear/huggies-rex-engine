// ========================================
// REQUEST_OPTIONS
// per-call bag for things that aren't part of the request payload
// itself: the api key and an optional header passthrough.
//
// `build_headers` turns an options bag + caller-supplied headers into
// the final header map. it knows one key:
//
//   api_key -> x-api-key: <key>
//           -> x-session-token: <key>
//
// any other header the caller supplies is passed through verbatim.
//
// --- WHY --- BOTH header names are sent. the backend reads
// `x-api-key` first and falls back to the legacy `x-session-token`
// during the beta, so a client built against either name works. the
// old name is not the new name's twin by accident: an agent built
// against `x-session-token` is out in the world already, and it would
// break the moment the backend stopped reading that header. sending
// both costs one extra header and keeps every old client alive.
//
// --- WHY --- the new name is sent too and not only the old one: the
// backend asks for `x-api-key`, and the new name is the one that will
// outlive the beta.
//
// --- WHY --- the two headers carry the SAME value: the middleware is
// the only reader of them, and it prefers the new name. sending two
// different values would be a way to lie about which key is in play.
// ========================================

export interface REQUEST_OPTIONS {
  // the api key — the bearer token the user handed to the agent.
  api_key?: string;
  headers?: Record<string, string>;
}

export function build_headers(
  options: REQUEST_OPTIONS = {},
  extra: Record<string, string> = {},
): Record<string, string> {
  const out: Record<string, string> = {};
  if (options.api_key) {
    out["x-api-key"] = options.api_key;
    // the legacy name. the backend still reads it, so an old agent
    // keeps working. it goes away when the beta is over.
    out["x-session-token"] = options.api_key;
  }
  Object.assign(out, extra, options.headers ?? {});
  return out;
}

// ========================================
// copyright 2026 by sleet.near
