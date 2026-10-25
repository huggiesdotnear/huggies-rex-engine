// ========================================
// client for the Trezu proxy treasury listing endpoint.
// ========================================
import {
  api_huggies_treasuries_get,
  type HUGGIES_TREASURY,
} from "../../../middleman/huggies";
export type { HUGGIES_TREASURY };
// ========================================
// list DAOs associated with an account through the Trezu proxy.
export async function list_trezu_treasuries_fun(
  account_id: string,
): Promise<HUGGIES_TREASURY[]> {
  return api_huggies_treasuries_get({ accountId: account_id });
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
