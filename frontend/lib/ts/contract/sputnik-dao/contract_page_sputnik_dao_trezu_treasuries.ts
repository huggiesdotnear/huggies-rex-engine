// ========================================
// client for the Trezu proxy treasury listing endpoint.
// ========================================
import {
  api_trezu_treasuries_get,
  type TREZU_TREASURY,
} from "@huggies/huggies-rex-engine-middleman";
import { HUGGIES_BASE_URL } from "./contract_page_sputnik_dao_base_url";
export type { TREZU_TREASURY };
// ========================================
// list DAOs associated with an account through the Trezu proxy.
export async function list_trezu_treasuries_fun(
  account_id: string,
): Promise<TREZU_TREASURY[]> {
  return api_trezu_treasuries_get(HUGGIES_BASE_URL, {
    accountId: account_id,
  });
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
