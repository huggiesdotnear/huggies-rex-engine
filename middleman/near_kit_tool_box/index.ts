// ========================================
// NEAR_KIT_TOOL_BOX
// a LOCAL stand-in for @near-kit-tool-box/fun.
//
// the published package (0.2.1) does not carry the Rhea DCL /
// INTEAR DEX helpers yet, so this folder holds typed local versions
// of them. the function names deliberately match the published
// package's names, so when the package ships these helpers the whole
// folder can be deleted and the imports swapped to the package with
// no call-site changes.
//
// one helper per file in fun/, typed shapes in types/, shared
// plumbing in stuff/. see README.md in this folder.
// ========================================

// ---------- generic contract view ----------
// ========================================
export { near_kit_contract_view_fun_json } from "./fun/near_kit_contract_view_fun_json";

// ---------- rhea amm v2 ----------
// ========================================
export { rhea_ammv2_get_number_of_pools_fun_json } from "./fun/rhea_ammv2_get_number_of_pools_fun_json";
export { rhea_ammv2_get_pool_shares_fun_json } from "./fun/rhea_ammv2_get_pool_shares_fun_json";
export { rhea_ammv2_get_pool_shares_batch_fun_json } from "./fun/rhea_ammv2_get_pool_shares_batch_fun_json";

// ---------- rhea dcl v2 ----------
// ========================================
export { rhea_dclv2_list_user_assets_fun_json } from "./fun/rhea_dclv2_list_user_assets_fun_json";

// ---------- intear dex engine ----------
// ========================================
export { intear_dex_engine_registered_assets_of_fun_json } from "./fun/intear_dex_engine_registered_assets_of_fun_json";
export { intear_dex_engine_dex_view_fun_json } from "./fun/intear_dex_engine_dex_view_fun_json";

// ---------- intear dex xyk sub-dex ----------
// ========================================
export { intear_dex_xyk_get_pool_count_fun_json } from "./fun/intear_dex_xyk_get_pool_count_fun_json";
export { intear_dex_xyk_get_pools_fun_json } from "./fun/intear_dex_xyk_get_pools_fun_json";
export { intear_dex_xyk_get_pool_shares_fun_json } from "./fun/intear_dex_xyk_get_pool_shares_fun_json";

// ---------- intear dex asset ids ----------
// ========================================
export { intear_dex_asset_id_fun } from "./fun/intear_dex_asset_id_fun";
export { intear_dex_asset_token_id_fun } from "./fun/intear_dex_asset_token_id_fun";

// ---------- shared plumbing ----------
// ========================================
export { BorshReader, BorshWriter } from "./stuff/near_kit_borsh";
export {
  base64_to_bytes_fun,
  bytes_to_base64_fun,
} from "./stuff/near_kit_borsh";
export { near_kit_contract_view_fun } from "./stuff/near_kit_contract_view";
export {
  NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID,
  NEAR_KIT_INTEAR_DEX_XYK_DEX_ID,
  near_kit_intear_dex_view_fun,
  near_kit_intear_dex_view_raw_fun,
} from "./stuff/near_kit_intear_dex_view";
export {
  near_kit_parse_intear_dex_asset_id_fun,
  near_kit_intear_dex_asset_token_id_fun,
  near_kit_read_intear_dex_asset_id_fun,
  near_kit_write_intear_dex_asset_id_fun,
} from "./stuff/near_kit_intear_dex_asset_id";
export {
  near_kit_read_intear_pool_share_fun,
  near_kit_read_intear_pool_view_fun,
} from "./stuff/near_kit_intear_dex_xyk_decode";

// ---------- shared types ----------
// ========================================
export type {
  rhea_ammv2_args,
  rhea_dclv2_args,
  intear_dex_engine_args,
  intear_dex_xyk_args,
} from "./types/near_kit_args";
export type {
  RHEA_AMMV2_POOL_SHARES_TYPE,
  RHEA_AMMV2_POOL_SHARES_BATCH_TYPE,
} from "./types/rhea_ammv2_view_types";
export type { RHEA_DCLV2_USER_ASSETS_TYPE } from "./types/rhea_dclv2_types";
export type {
  INTEAR_DEX_ASSET_ID_PARSED_TYPE,
  INTEAR_DEX_ASSET_ID_STRING,
  INTEAR_DEX_REGISTERED_ASSET_OBJECT_TYPE,
  INTEAR_DEX_REGISTERED_ASSET_TYPE,
} from "./types/intear_dex_engine_types";
export type {
  INTEAR_DEX_XYK_ASSET_WITH_BALANCE_TYPE,
  INTEAR_DEX_XYK_POOL_SHARE_TYPE,
  INTEAR_DEX_XYK_POOL_SHARES_TYPE,
  INTEAR_DEX_XYK_POOL_VIEW_TYPE,
} from "./types/intear_dex_xyk_types";
// ========================================
// copyright 2026 by sleet.near
// ========================================
