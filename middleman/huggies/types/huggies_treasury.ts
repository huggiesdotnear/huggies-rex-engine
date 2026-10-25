// ========================================
// HUGGIES_TREASURY
// one treasury (sputnik dao) as trezu returns it for an account.
// `daoId` is the dao account, `config` carries the display info and
// can be null, the four flags describe how the account relates to the
// treasury.
//
// --- WHY --- the field names are camelCase on purpose: the backend
// forwards the trezu json untouched, so these are the exact keys that
// arrive in the browser.
// ========================================

import type { HUGGIES_TREASURY_CONFIG } from "./huggies_treasury_config";

export interface HUGGIES_TREASURY {
  daoId: string;
  config: HUGGIES_TREASURY_CONFIG | null;
  isMember: boolean;
  isSaved: boolean;
  isHidden: boolean;
  isConfidential: boolean;
}
// ========================================
// copyright 2026 by sleet.near
