// ========================================
// HUGGIES
// typed client for our own backend routes.
//
// every call is same-origin against the backend we serve, so the
// browser never talks to a third party api directly.
//
// the trezu routes we proxy are named after the api they front, not
// after us: `api_trezu_*` talks to trezu (through our backend), so
// the name says which api is on the other end. `HUGGIES_BASE_URL` is
// the one piece that names us — it is our own origin.
// ========================================

export * from "./fun/api_trezu_treasuries_get";

export { HUGGIES_BASE_URL } from "./stuff/huggies_base_url";
export { TREZU_ENDPOINT_PATHS } from "./stuff/trezu_endpoint_paths";
export type { TREZU_ENDPOINT_KEY } from "./stuff/trezu_endpoint_paths";
export type { TREZU_API_ERROR } from "./stuff/trezu_parse_error";

export type { TREZU_TREASURY } from "./types/trezu_treasury";
export type { TREZU_TREASURY_CONFIG } from "./types/trezu_treasury_config";
export type { TREZU_TREASURY_METADATA } from "./types/trezu_treasury_metadata";
export type { TREZU_TREASURIES_QUERY } from "./types/trezu_treasuries_query";
// ========================================
// copyright 2026 by sleet.near
