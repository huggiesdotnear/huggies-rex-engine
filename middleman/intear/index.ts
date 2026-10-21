// ========================================
// INTEAR
// typed client for the intear api (https://api.intea.rs). one-shot
// HTTP only — no websocket, no subscriptions. response types come from
// @sleet-js/intear-api-tool-box (a dependency for its TYPES; the
// transport here is our own fetch in api_intear_get), so no sdk code
// is bundled into the page.
//
// WHY DIRECT FROM THE BROWSER: routing intear through our backend
// would spend the backend's rate limit on data the browser can fetch
// itself, so this middleman calls api.intea.rs directly.
//
// one endpoint per file in fun/, shared plumbing in stuff/. every
// call logs a framed block, same as the graupelos middleman.
// ========================================

export * from "./fun/api_intear_get";
export * from "./fun/api_intear_tokens_get";
export * from "./fun/api_intear_token_fields";
export * from "./fun/api_intear_candles_get";
export * from "./fun/api_intear_balances_get";
export * from "./fun/api_intear_holders_get";
export * from "./fun/api_intear_positions_get";
export * from "./fun/api_intear_prices_at_get";

export { INTEAR_BASE_URL } from "./stuff/intear_base_url";
export { INTEAR_ENDPOINT_PATHS } from "./stuff/intear_endpoint_paths";
export type { INTEAR_ENDPOINT_KEY } from "./stuff/intear_endpoint_paths";
export type { INTEAR_API_ERROR } from "./stuff/intear_parse_error";
// ========================================
// copyright 2026 by sleet.near
