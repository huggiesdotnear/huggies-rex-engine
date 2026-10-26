// ========================================
// HUGGIES_BASE_URL
// the origin our own backend runs on. same-origin by default, so the
// browser never hits a cross-origin host for our /api/* routes.
// ========================================

export const HUGGIES_BASE_URL =
  typeof window !== "undefined" && typeof window.location !== "undefined"
    ? window.location.origin
    : "";
// ========================================
// copyright 2026 by sleet.near
