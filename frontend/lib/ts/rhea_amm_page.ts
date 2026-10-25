// ========================================
// data loader for the Rhea AMM contract page.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import {
  near_kit_contract_view_fun_json,
  rhea_ammv2_get_number_of_pools_fun_json,
} from "../../../middleman/near_kit_tool_box";
// ========================================
const HUGGIES_RHEA_AMM_POOL_LIMIT = 500;
// ========================================
export interface HUGGIES_RHEA_AMM_POOL {
  pool_id: number;
  dex: string;
  token_ids: string[];
  amounts: string[];
  shares_total_supply: string;
}
export interface HUGGIES_RHEA_AMM_DATA {
  pools: HUGGIES_RHEA_AMM_POOL[];
  total_pools: number;
  errors: string[];
}
// ========================================
// load the live Rhea AMM pool collection and the contract pool count.
export async function load_rhea_amm_page_fun(): Promise<HUGGIES_RHEA_AMM_DATA> {
  const contract_id = "v2.ref-finance.near";
  const near = near_kit_client();
  const errors: string[] = [];
  let pools: HUGGIES_RHEA_AMM_POOL[] = [];
  let total_pools = 0;

  try {
    total_pools = await rhea_ammv2_get_number_of_pools_fun_json(
      near,
      contract_id,
    );
  } catch (err) {
    errors.push(
      `pool count: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  try {
    const raw = await near_kit_contract_view_fun_json<
      Array<{
        pool_kind: string;
        token_account_ids: string[];
        amounts: string[];
        shares_total_supply: string;
      }>
    >(near, contract_id, "get_pools", {
      from_index: 0,
      limit: HUGGIES_RHEA_AMM_POOL_LIMIT,
    });
    pools = raw.map((pool, pool_id) => ({
      pool_id,
      dex: pool.pool_kind,
      token_ids: pool.token_account_ids,
      amounts: pool.amounts,
      shares_total_supply: pool.shares_total_supply,
    }));
  } catch (err) {
    errors.push(`pools: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (total_pools === 0) total_pools = pools.length;
  return { pools, total_pools, errors };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
