// ========================================
// INTEAR_ENDPOINT_PATHS
// the path for every one-shot endpoint this middleman calls. one key
// per endpoint so the path is written down exactly once.
//
// only GET / one-shot endpoints live here — no websocket, no
// subscriptions. `api_intear_*` wrappers pick a key and a params
// object; `api_intear_get` does the rest.
// ========================================

export const INTEAR_ENDPOINT_PATHS = {
  api_intear_tokens: "/tokens",
  api_intear_tokens_search: "/tokens/search",
  api_intear_trades: "/trades",
  api_intear_transfers: "/transfers",
  api_intear_activity: "/activity",
  api_intear_candles: "/candles",
  api_intear_balances: "/balances",
  api_intear_holders: "/holders",
  api_intear_positions: "/positions",
  api_intear_prices_at: "/prices/at",
  api_intear_accounts_search: "/accounts/search",
  api_intear_schema: "/schema",
} as const;

export type INTEAR_ENDPOINT_KEY = keyof typeof INTEAR_ENDPOINT_PATHS;
// ========================================
// copyright 2026 by sleet.near
