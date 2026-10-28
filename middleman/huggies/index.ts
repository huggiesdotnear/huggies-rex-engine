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
// the shared plumbing keeps the app name: `HUGGIES_BASE_URL` is our
// own origin, and `huggies_parse_error` parses the error envelope
// OUR backend answers with.
// ========================================

export * from "./fun/api_huggies_ping_get";
export * from "./fun/api_trezu_treasuries_get";

export { HUGGIES_BASE_URL } from "./stuff/huggies_base_url";
export { huggies_build_query } from "./stuff/huggies_build_query";
export { HUGGIES_ENDPOINT_PATHS } from "./stuff/huggies_endpoint_paths";
export type { HUGGIES_ENDPOINT_KEY } from "./stuff/huggies_endpoint_paths";
export { huggies_parse_error } from "./stuff/huggies_parse_error";
export type { HUGGIES_API_ERROR } from "./stuff/huggies_parse_error";
export { TREZU_ENDPOINT_PATHS } from "./stuff/trezu_endpoint_paths";
export type { TREZU_ENDPOINT_KEY } from "./stuff/trezu_endpoint_paths";

export type { HUGGIES_PING } from "./types/huggies_ping";
export type { TREZU_TREASURY } from "./types/trezu_treasury";
export type { TREZU_TREASURY_CONFIG } from "./types/trezu_treasury_config";
export type { TREZU_TREASURY_METADATA } from "./types/trezu_treasury_metadata";
export type { TREZU_TREASURIES_QUERY } from "./types/trezu_treasuries_query";
// ========================================
// copyright 2026 by sleet.near
