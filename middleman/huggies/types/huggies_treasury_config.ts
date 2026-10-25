// ========================================
// HUGGIES_TREASURY_CONFIG
// the config trezu attaches to a treasury. `metadata` can be null
// entirely, the rest of the fields can be missing, and
// `isConfidential` is always present.
//
// --- WHY --- the field names are camelCase on purpose: the backend
// forwards the trezu json untouched, so these are the exact keys that
// arrive in the browser.
// ========================================

import type { HUGGIES_TREASURY_METADATA } from "./huggies_treasury_metadata";

export interface HUGGIES_TREASURY_CONFIG {
  metadata: HUGGIES_TREASURY_METADATA | null;
  name?: string;
  purpose?: string;
  isConfidential: boolean;
}
// ========================================
// copyright 2026 by sleet.near
