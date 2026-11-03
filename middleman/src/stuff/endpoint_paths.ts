// ========================================
// ENDPOINT_PATHS
// ========================================

export const ENDPOINT_PATHS = {
  // --- /api/huggies/* — our own routes ---
  api_huggies_ping: "/api/huggies/ping",
  api_huggies_sessions: "/api/huggies/sessions",
  api_huggies_session_me: "/api/huggies/session/me",
  api_huggies_session_rotate: "/api/huggies/session/rotate",

  // --- /api/trezu/* — our proxy for the trezu api ---
  api_trezu_treasuries: "/api/trezu/user/treasuries",
} as const;

export type EndpointKey = keyof typeof ENDPOINT_PATHS;
// ========================================
// copyright 2026 by sleet.near
