// ========================================
// ENDPOINT_PATHS
// ========================================

export const ENDPOINT_PATHS = {
  // --- /api/shit-1170/* — our own routes ---
  api_shit_1170_ping: "/api/shit-1170/ping",
  api_shit_1170_sessions: "/api/shit-1170/sessions",
  api_shit_1170_session_me: "/api/shit-1170/session/me",
  api_shit_1170_session_rotate: "/api/shit-1170/session/rotate",

  // --- /api/trezu/* — our proxy for the trezu api ---
  api_trezu_treasuries: "/api/trezu/user/treasuries",
} as const;

export type EndpointKey = keyof typeof ENDPOINT_PATHS;
// ========================================
// copyright 2026 by sleet.near
