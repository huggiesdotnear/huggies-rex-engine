// ========================================
// typed local view helper for Rhea DCL v2 internal user assets.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
// ========================================
export interface HUGGIES_RHEA_DCL_USER_ASSETS {
  [token_id: string]: string;
}
// ========================================
// fetch an account's internal token balances from Rhea DCL v2.
export async function rhea_dcl_user_assets_fun(
  account_id: string,
): Promise<HUGGIES_RHEA_DCL_USER_ASSETS> {
  const value = await near_kit_client().view<unknown>(
    "dclv2.ref-labs.near",
    "list_user_assets",
    { account_id },
  );
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Rhea DCL list_user_assets returned an invalid object");
  }
  const out: HUGGIES_RHEA_DCL_USER_ASSETS = {};
  for (const [token_id, balance] of Object.entries(value)) {
    if (typeof balance === "string") out[token_id] = balance;
  }
  return out;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
