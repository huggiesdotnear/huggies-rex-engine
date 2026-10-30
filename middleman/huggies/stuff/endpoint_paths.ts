// ========================================
// ENDPOINT_PATHS
// ========================================

export const ENDPOINT_PATHS = {
  // --- /api/huggies/* — our own routes, nothing is proxied ---
  api_huggies_ping: "/api/huggies/ping",

  // --- /api/trezu/* — our proxy for the trezu api ---
  api_trezu_treasuries: "/api/trezu/user/treasuries",
} as const;

export type EndpointKey = keyof typeof ENDPOINT_PATHS;
// ========================================
// copyright 2026 by sleet.near
