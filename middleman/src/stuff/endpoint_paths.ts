// ========================================
// ENDPOINT_PATHS
// ========================================

export const ENDPOINT_PATHS = {
  // --- /api/shit-1170/* — our own routes ---
  api_shit_1170_ping: "/api/shit-1170/ping",
  api_shit_1170_api_keys: "/api/shit-1170/api-keys",
  api_shit_1170_api_key_me: "/api/shit-1170/api-key/me",
  api_shit_1170_api_key_rotate: "/api/shit-1170/api-key/rotate",

  // --- the tx queue ---
  // --- WHY --- the queue routes that carry a queue_id are NOT in this
  // map: their path has a piece in the middle of it, so they are built
  // by the wrapper and handed to api_call as a full path. see
  // api_shit_1170_tx_queue_one_get.ts.
  api_shit_1170_tx_queue: "/api/shit-1170/tx-queue",
  api_shit_1170_tx_queue_stats_contracts:
    "/api/shit-1170/tx-queue/stats/contracts",
  api_shit_1170_tx_queue_stats_methods: "/api/shit-1170/tx-queue/stats/methods",

  // --- the swap queue ---
  // --- WHY --- the swap queue routes that carry a swap_id are NOT in
  // this map: their path has a piece in the middle of it, so they are
  // built by the wrapper and handed to api_call as a full path. see
  // api_shit_1170_swap_queue_one_get.ts.
  api_shit_1170_swap_queue: "/api/shit-1170/swap-queue",

  // --- /api/trezu/* — our proxy for the trezu api ---
  api_trezu_treasuries: "/api/trezu/user/treasuries",
} as const;

export type EndpointKey = keyof typeof ENDPOINT_PATHS;
// ========================================
// copyright 2026 by sleet.near
