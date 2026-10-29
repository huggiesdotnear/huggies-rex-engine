// ========================================
// RHEA_DCLV2_LIST_USER_ASSETS_FUN_JSON
// View: `list_user_assets`. Returns all internal token balances of one
// account, keyed by token id.
//
// it replaces frontend/lib/ts/rhea_dcl_user_assets.ts.
// ========================================
import type { Near } from "near-kit";
import type { rhea_dclv2_args } from "../types/near_kit_args";
import type { RHEA_DCLV2_USER_ASSETS_TYPE } from "../types/rhea_dclv2_types";
// ========================================
// fetch an account's internal token balances from Rhea DCL v2.
export async function rhea_dclv2_list_user_assets_fun_json(
  near: Near,
  rhea_dclv2_contract_id: string,
  account_id: rhea_dclv2_args["account_id"],
): Promise<RHEA_DCLV2_USER_ASSETS_TYPE> {
  const result = await near.view<unknown>(
    rhea_dclv2_contract_id,
    "list_user_assets",
    { account_id },
  );
  if (result === null || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("Rhea DCL list_user_assets returned an invalid object");
  }
  const out: RHEA_DCLV2_USER_ASSETS_TYPE = {};
  for (const [token_id, balance] of Object.entries(result)) {
    if (typeof balance === "string") out[token_id] = balance;
  }
  return out;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
