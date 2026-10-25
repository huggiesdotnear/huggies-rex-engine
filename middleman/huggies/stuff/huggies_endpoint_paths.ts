// ========================================
// HUGGIES_ENDPOINT_PATHS
// the path of every backend route this middleman calls, written down
// exactly once.
// ========================================

export const HUGGIES_ENDPOINT_PATHS = {
  api_huggies_treasuries: "/api/huggies/treasuries",
} as const;

export type HUGGIES_ENDPOINT_KEY = keyof typeof HUGGIES_ENDPOINT_PATHS;
// ========================================
// copyright 2026 by sleet.near
