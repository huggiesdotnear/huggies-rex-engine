// ========================================
// HUGGIES_BASE_URL
// the base url every frontend fetch to our own backend goes through.
// the frontend is served by the same huggies backend (ServeDir on /),
// so the origin is the page itself.
//
// we resolve it from `window.location.origin` at runtime so the api
// path is always anchored at the server root, no matter which
// subdirectory the page lives in. a literal "." would make
// `./api/huggies/...` resolve to `/contract/api/huggies/...` when the
// page is served from `/contract/...html`, which 404s. the SSR guard
// returns "" so this module is importable from non-browser contexts
// (tests, future node scripts) without throwing.
//
// --- WHY --- the middleman takes the base url as a parameter, not as
// a constant it imports: a bin has to be able to point the same
// wrapper at a different backend. the frontend's origin is just the
// value it happens to pass.
// ========================================

export const HUGGIES_BASE_URL =
  typeof window !== "undefined" && typeof window.location !== "undefined"
    ? window.location.origin
    : "";
// ========================================
// copyright 2026 by sleet.near
