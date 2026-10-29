// ========================================
// typed shapes returned by the INTEAR DEX engine views.
//
// mirrors the `intear_dex_engine_types` of @near-kit-tool-box/fun so
// the local stand-in and the published package agree on the names.
// ========================================

// ========================================
// the INTEAR DEX `AssetId` string form.
// `near`, `nep141:<contract_id>`, `nep245:<contract_id>:<token_id>`
// or `nep171:<contract_id>:<token_id>`.
export type INTEAR_DEX_ASSET_ID_STRING =
  | "near"
  | `nep141:${string}`
  | `nep245:${string}:${string}`
  | `nep171:${string}:${string}`;

// ========================================
// the parsed parts of an INTEAR DEX asset id.
export interface INTEAR_DEX_ASSET_ID_PARSED_TYPE {
  kind: "near" | "nep141" | "nep245" | "nep171";
  contract_id: string | null;
  token_id: string | null;
}

// ========================================
// one registered asset of an account or dex, with its inner balance.
// the contract answers with `[asset_id, balance]` tuples.
export type INTEAR_DEX_REGISTERED_ASSET_TYPE = [
  INTEAR_DEX_ASSET_ID_STRING,
  string,
];

// ========================================
// a registered asset as an object, for callers who prefer named
// fields. built by the helper from the tuple the contract returns.
export interface INTEAR_DEX_REGISTERED_ASSET_OBJECT_TYPE {
  asset_id: INTEAR_DEX_ASSET_ID_STRING;
  balance: string;
}
// ========================================
// copyright 2026 by sleet.near
