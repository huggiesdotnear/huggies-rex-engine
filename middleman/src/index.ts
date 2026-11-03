// ========================================
// SHIT_1170
// typed client for our own backend routes. every call is same-origin
// against the backend we serve, so the browser never talks to a third
// party api directly.
//
// the naming rule (see DOCS/ROUTES.md): a route is named after the api
// it fronts, not after us.
//   * `api_shit_1170_*` — our OWN routes, under /api/shit-1170/*.
//   * `api_trezu_*` — the trezu routes we proxy, under /api/trezu/*.
//
// the base url is a parameter on every call: the frontend passes the
// origin of the page it is served from, a bin whatever backend it was
// told to talk to.
// ========================================

export * from "./fun/api_shit_1170_ping_get";
export * from "./fun/api_shit_1170_session_me_get";
export * from "./fun/api_shit_1170_session_rotate_post";
export * from "./fun/api_shit_1170_sessions_post";
export * from "./fun/api_trezu_treasuries_get";

export { api_call } from "./stuff/api_call";
export type { API_CALL_PARAMS } from "./stuff/api_call";
export { ENDPOINT_PATHS } from "./stuff/endpoint_paths";
export type { EndpointKey } from "./stuff/endpoint_paths";
export { parse_error } from "./stuff/parse_error";
export type {
  SHIT_1170_API_ERROR,
  PARSE_ERROR_CONTEXT,
} from "./stuff/parse_error";
export { build_headers } from "./stuff/request_options";
export type { REQUEST_OPTIONS } from "./stuff/request_options";

export type { SHIT_1170_ERROR_RESPONSE } from "./types/common";
export type { SHIT_1170_PING } from "./types/shit_1170_ping";
export type {
  SHIT_1170_SESSION_KEY,
  SHIT_1170_SESSION_ME,
  SHIT_1170_SESSIONS_REQUEST,
  SHIT_1170_SESSIONS_RESPONSE,
  SHIT_1170_SIGNED_ACCOUNT,
} from "./types/shit_1170_sessions";
export type { TREZU_TREASURY } from "./types/trezu_treasury";
export type { TREZU_TREASURY_CONFIG } from "./types/trezu_treasury_config";
export type { TREZU_TREASURY_METADATA } from "./types/trezu_treasury_metadata";
export type { TREZU_TREASURIES_QUERY } from "./types/trezu_treasuries_query";
// ========================================
// copyright 2026 by sleet.near
