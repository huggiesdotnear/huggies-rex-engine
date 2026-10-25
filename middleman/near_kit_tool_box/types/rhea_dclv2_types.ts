// ========================================
// typed shapes returned by the Rhea DCL v2 views.
//
// mirrors the `rhea_dclv2_types` of @near-kit-tool-box/fun so the
// local stand-in and the published package agree on the names.
// ========================================

// ========================================
// one internal token balance of one account, keyed by token id.
export interface RHEA_DCLV2_USER_ASSETS_TYPE {
  [token_id: string]: string;
}
// ========================================
// copyright 2026 by sleet.near
