// ========================================
// HUGGIES
// typed client for our own backend routes.
//
// every call is same-origin against the backend we serve, so the
// browser never talks to a third party api directly.
//
// the naming rule (see DOCS/ROUTES.md): a route is named after the
// api it fronts, not after us.
//   * `api_huggies_*` — our OWN routes, under /api/huggies/*. nothing
//     is proxied through them.
//   * `api_trezu_*` — the trezu routes we proxy, under /api/trezu/*.
//     the name says which api is on the other end.
//
// the shared plumbing keeps the app name: `api_call` is the one
// fetch+log+error helper every wrapper goes through, and
// `parse_error` parses the error envelope OUR backend answers with.
//
// the base url is a parameter on every call, not a constant: the
// frontend passes the origin of the page it is served from, and a bin
// passes whatever backend it was told to talk to.
// ========================================

export * from "./fun/api_huggies_ping_get";
export * from "./fun/api_trezu_treasuries_get";

export { api_call } from "./stuff/api_call";
export type { API_CALL_PARAMS } from "./stuff/api_call";
export { ENDPOINT_PATHS } from "./stuff/endpoint_paths";
export type { EndpointKey } from "./stuff/endpoint_paths";
export { endpoint_url } from "./stuff/endpoint_url";
export { parse_error } from "./stuff/parse_error";
export type {
  HUGGIES_API_ERROR,
  PARSE_ERROR_CONTEXT,
} from "./stuff/parse_error";
export { render_path } from "./stuff/render_path";
export { build_headers } from "./stuff/request_options";
export type { REQUEST_OPTIONS } from "./stuff/request_options";

export type { HUGGIES_ERROR_RESPONSE } from "./types/common";
export type { HUGGIES_PING } from "./types/huggies_ping";
export type { TREZU_TREASURY } from "./types/trezu_treasury";
export type { TREZU_TREASURY_CONFIG } from "./types/trezu_treasury_config";
export type { TREZU_TREASURY_METADATA } from "./types/trezu_treasury_metadata";
export type { TREZU_TREASURIES_QUERY } from "./types/trezu_treasuries_query";
// ========================================
// copyright 2026 by sleet.near
