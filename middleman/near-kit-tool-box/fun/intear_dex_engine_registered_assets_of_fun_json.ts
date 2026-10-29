// ========================================
// INTEAR_DEX_ENGINE_REGISTERED_ASSETS_OF_FUN_JSON
// View: the engine's `registered_assets_of`. Returns the registered
// assets and their inner balances of one account or one dex.
//
// `account_id` and `dex_id` are mutually exclusive — pass exactly one
// of them. `dex_id` is the `<deployer>/<id>` string form.
//
// the contract answers with `[asset_id, balance]` tuples; this helper
// turns them into `{ asset_id, balance }` objects.
//
// it replaces frontend/lib/ts/intear_registered_assets.ts, which
// paged through the view by itself.
// ========================================
import type { Near } from "near-kit";
import type { intear_dex_engine_args } from "../types/near_kit_args";
import type {
  INTEAR_DEX_ASSET_ID_STRING,
  INTEAR_DEX_REGISTERED_ASSET_OBJECT_TYPE,
} from "../types/intear_dex_engine_types";
// ========================================
// fetch one page of registered internal assets and balances.
export async function intear_dex_engine_registered_assets_of_fun_json(
  near: Near,
  engine_contract_id: string,
  account_id: intear_dex_engine_args["account_id"],
  dex_id: intear_dex_engine_args["dex_id"],
  from_index: intear_dex_engine_args["from_index"],
  limit: intear_dex_engine_args["limit"],
): Promise<INTEAR_DEX_REGISTERED_ASSET_OBJECT_TYPE[]> {
  const result = await near.view<unknown>(
    engine_contract_id,
    "registered_assets_of",
    { account_id, dex_id, from_index, limit },
  );
  if (!Array.isArray(result)) {
    throw new Error("INTEAR registered_assets_of returned an invalid array");
  }
  return result.map((row) => {
    if (
      !Array.isArray(row) ||
      row.length !== 2 ||
      typeof row[0] !== "string" ||
      typeof row[1] !== "string"
    ) {
      throw new Error("INTEAR registered_assets_of returned an invalid row");
    }
    return {
      asset_id: row[0] as INTEAR_DEX_ASSET_ID_STRING,
      balance: row[1],
    };
  });
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
