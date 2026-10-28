// ========================================
// HUGGIES_ENDPOINT_PATHS
// the path of every backend route of OUR OWN api this middleman calls,
// written down exactly once.
//
// these routes live under /api/huggies/* — nothing is proxied through
// them, they ARE ours. the routes we proxy for another api keep their
// own paths file, named after that api (see trezu_endpoint_paths.ts).
// ========================================

export const HUGGIES_ENDPOINT_PATHS = {
  api_huggies_ping: "/api/huggies/ping",
} as const;

export type HUGGIES_ENDPOINT_KEY = keyof typeof HUGGIES_ENDPOINT_PATHS;
// ========================================
// copyright 2026 by sleet.near
