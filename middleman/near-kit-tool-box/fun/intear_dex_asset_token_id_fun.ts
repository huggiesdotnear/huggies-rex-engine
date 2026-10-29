// ========================================
// INTEAR_DEX_ASSET_TOKEN_ID_FUN
// returns the contract id used to look up token metadata for an
// INTEAR DEX asset id.
//
// it replaces frontend/lib/ts/intear_asset_token_id.ts.
// ========================================
import { near_kit_intear_dex_asset_token_id_fun } from "../stuff/near_kit_intear_dex_asset_id";
// ========================================
// return the contract id used to look up token metadata.
export function intear_dex_asset_token_id_fun(asset_id: string): string {
  return near_kit_intear_dex_asset_token_id_fun(asset_id);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
