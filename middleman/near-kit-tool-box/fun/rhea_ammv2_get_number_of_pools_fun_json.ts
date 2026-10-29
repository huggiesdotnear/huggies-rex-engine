// ========================================
// RHEA_AMMV2_GET_NUMBER_OF_POOLS_FUN_JSON
// View: `get_number_of_pools`. Returns how many pools the Rhea AMM
// contract holds.
//
// the published @near-kit-tool-box/fun already ships this one, so it
// is only kept here so the frontend has a single place to import
// chain calls from. delete this folder's copy together with the rest
// once the package carries the Rhea DCL / INTEAR DEX helpers.
// ========================================
import type { Near } from "near-kit";
// ========================================
// fetch how many pools the Rhea AMM contract holds.
export async function rhea_ammv2_get_number_of_pools_fun_json(
  near: Near,
  rhea_ammv2_contract_id: string,
): Promise<number> {
  const result = await near.view<unknown>(
    rhea_ammv2_contract_id,
    "get_number_of_pools",
  );
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("Rhea get_number_of_pools returned an invalid value");
  }
  return result;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
