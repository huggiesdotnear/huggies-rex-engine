// ========================================
// HUGGIES_TREASURY_METADATA
// the metadata block trezu puts on a treasury config. both color and
// logo can be null, so both are optional.
//
// --- WHY --- the field names are camelCase on purpose: the backend
// forwards the trezu json untouched, so these are the exact keys that
// arrive in the browser. renaming them here would break every caller.
// ========================================

export interface HUGGIES_TREASURY_METADATA {
  primaryColor?: string | null;
  flagLogo?: string | null;
}
// ========================================
// copyright 2026 by sleet.near
