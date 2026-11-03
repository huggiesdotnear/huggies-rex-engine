// ========================================
// client for the Trezu proxy treasury listing endpoint.
// ========================================
import {
  api_trezu_treasuries_get,
  type TREZU_TREASURY,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_BASE_URL } from "../../shared/base_url";
export type { TREZU_TREASURY };
// ========================================
// list DAOs associated with an account through the Trezu proxy.
export async function list_trezu_treasuries_fun(
  account_id: string,
): Promise<TREZU_TREASURY[]> {
  return api_trezu_treasuries_get(SHIT_1170_BASE_URL, {
    accountId: account_id,
  });
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
