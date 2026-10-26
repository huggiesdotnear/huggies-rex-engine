// ========================================
// HUGGIES
// typed client for our own backend routes.
//
// every call is same-origin against the backend we serve, so the
// browser never talks to a third party api directly.
// ========================================

export * from "./fun/api_huggies_treasuries_get";

export { HUGGIES_BASE_URL } from "./stuff/huggies_base_url";
export { HUGGIES_ENDPOINT_PATHS } from "./stuff/huggies_endpoint_paths";
export type { HUGGIES_ENDPOINT_KEY } from "./stuff/huggies_endpoint_paths";
export type { HUGGIES_API_ERROR } from "./stuff/huggies_parse_error";

export type { HUGGIES_TREASURY } from "./types/huggies_treasury";
export type { HUGGIES_TREASURY_CONFIG } from "./types/huggies_treasury_config";
export type { HUGGIES_TREASURY_METADATA } from "./types/huggies_treasury_metadata";
export type { HUGGIES_TREASURIES_QUERY } from "./types/huggies_treasuries_query";
// ========================================
// copyright 2026 by sleet.near
