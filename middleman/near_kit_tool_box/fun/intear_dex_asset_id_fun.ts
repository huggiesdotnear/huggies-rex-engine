// ========================================
// INTEAR_DEX_ASSET_ID_FUN
// parses an INTEAR DEX asset id string into its parts.
//
// the string form (the form every JSON API of the engine uses) is:
//   - `near`                            — native NEAR
//   - `nep141:<contract_id>`            — NEP-141 fungible token
//   - `nep245:<contract_id>:<token_id>` — NEP-245 multi-token
//   - `nep171:<contract_id>:<token_id>` — NEP-171 NFT
//
// it replaces frontend/lib/ts/intear_asset_id.ts.
// ========================================
import { near_kit_parse_intear_dex_asset_id_fun } from "../stuff/near_kit_intear_dex_asset_id";
import type { INTEAR_DEX_ASSET_ID_PARSED_TYPE } from "../types/intear_dex_engine_types";
// ========================================
// parse an INTEAR DEX asset id string into its parts.
export function intear_dex_asset_id_fun(
  asset_id: string,
): INTEAR_DEX_ASSET_ID_PARSED_TYPE {
  return near_kit_parse_intear_dex_asset_id_fun(asset_id);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
