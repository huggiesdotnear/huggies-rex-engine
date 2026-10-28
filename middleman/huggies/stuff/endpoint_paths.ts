// ========================================
// ENDPOINT_PATHS
// path templates for every backend route the huggies middleman calls,
// written down exactly once.
//
// no base url — the caller supplies it.
//
// --- WHY --- one table, not one per api. the routes live under
// different prefixes because the prefix names the api being talked
// to (see DOCS/ROUTES.md), but the plumbing that calls them is the
// same, so they belong in one table. the key carries the same prefix
// as the path, so the key alone says which backend is on the other
// end:
//
//   api_huggies_ping      "/api/huggies/ping"     — ours
//   api_trezu_treasuries  "/api/trezu/user/treasuries" — proxied
//
// --- WHY --- one key per unique path. when a path is bound to
// multiple http methods (axum `.route(path, get(..).post(..))`) the
// method is decided at the call site and the key stays singular.
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
