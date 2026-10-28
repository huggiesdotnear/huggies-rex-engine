// ========================================
// TREZU_ENDPOINT_PATHS
// the path of every backend route this middleman calls, written down
// exactly once.
//
// the routes live under /api/trezu/* — the prefix names the api being
// talked to, so the url says which backend it belongs to and mirrors
// the upstream trezu path it proxies.
// ========================================

export const TREZU_ENDPOINT_PATHS = {
  api_trezu_treasuries: "/api/trezu/user/treasuries",
} as const;

export type TREZU_ENDPOINT_KEY = keyof typeof TREZU_ENDPOINT_PATHS;
// ========================================
// copyright 2026 by sleet.near
