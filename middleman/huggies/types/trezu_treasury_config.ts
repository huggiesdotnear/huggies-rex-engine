// ========================================
// TREZU_TREASURY_CONFIG
// the config trezu attaches to a treasury. `metadata` can be null
// entirely, the rest of the fields can be missing, and
// `isConfidential` is always present.
//
// the field names are camelCase on purpose: the backend forwards the
// trezu json untouched, so these are the exact keys that arrive in the
// browser.
// ========================================

import type { TREZU_TREASURY_METADATA } from "./trezu_treasury_metadata";

export interface TREZU_TREASURY_CONFIG {
  metadata: TREZU_TREASURY_METADATA | null;
  name?: string;
  purpose?: string;
  isConfidential: boolean;
}
// ========================================
// copyright 2026 by sleet.near
