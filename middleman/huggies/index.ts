// ========================================
// HUGGIES
// typed client for our own backend routes. every call is same-origin
// against the backend we serve, so the browser never talks to a third
// party api directly.
//
// the naming rule (see DOCS/ROUTES.md): a route is named after the api
// it fronts, not after us.
//   * `api_huggies_*` — our OWN routes, under /api/huggies/*.
//   * `api_trezu_*` — the trezu routes we proxy, under /api/trezu/*.
//
// the base url is a parameter on every call: the frontend passes the
// origin of the page it is served from, a bin whatever backend it was
// told to talk to.
// ========================================

export * from "./fun/api_huggies_ping_get";
export * from "./fun/api_trezu_treasuries_get";

export { api_call } from "./stuff/api_call";
export type { API_CALL_PARAMS } from "./stuff/api_call";
export { ENDPOINT_PATHS } from "./stuff/endpoint_paths";
export type { EndpointKey } from "./stuff/endpoint_paths";
export { parse_error } from "./stuff/parse_error";
export type {
  HUGGIES_API_ERROR,
  PARSE_ERROR_CONTEXT,
} from "./stuff/parse_error";
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
