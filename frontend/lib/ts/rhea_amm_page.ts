// ========================================
// data loader for the Rhea AMM contract page.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import {
  near_kit_contract_view_fun_json,
  rhea_ammv2_get_number_of_pools_fun_json,
} from "../../../middleman/near_kit_tool_box";
// ========================================
const HUGGIES_RHEA_AMM_CONTRACT_ID = "v2.ref-finance.near";
// how many pools one `get_pools` call returns. the contract handles a
// large page, and a bigger page means fewer round trips.
const HUGGIES_RHEA_AMM_BATCH_SIZE = 2000;
// ========================================
export interface HUGGIES_RHEA_AMM_POOL {
  pool_id: number;
  dex: string;
  token_ids: string[];
  amounts: string[];
  shares_total_supply: string;
  total_fee: number;
}
export interface HUGGIES_RHEA_AMM_DATA {
  pools: HUGGIES_RHEA_AMM_POOL[];
  total_pools: number;
  errors: string[];
}
// ========================================
// fetch one page of Rhea AMM pools.
async function fetch_rhea_amm_batch_fun(
  from_index: number,
  limit: number,
): Promise<HUGGIES_RHEA_AMM_POOL[]> {
  const near = near_kit_client();
  const raw = await near_kit_contract_view_fun_json<
    Array<{
      pool_kind: string;
      token_account_ids: string[];
      amounts: string[];
      shares_total_supply: string;
      total_fee: number;
    }>
  >(near, HUGGIES_RHEA_AMM_CONTRACT_ID, "get_pools", {
    from_index,
    limit,
  });
  return raw.map((pool, index) => ({
    pool_id: from_index + index,
    dex: pool.pool_kind,
    token_ids: pool.token_account_ids,
    amounts: pool.amounts,
    shares_total_supply: pool.shares_total_supply,
    total_fee: typeof pool.total_fee === "number" ? pool.total_fee : 0,
  }));
}
// ========================================
// load every Rhea AMM pool, in batches.
export async function load_rhea_amm_page_fun(): Promise<HUGGIES_RHEA_AMM_DATA> {
  const errors: string[] = [];
  let pools: HUGGIES_RHEA_AMM_POOL[] = [];
  let total_pools = 0;

  try {
    total_pools = await rhea_ammv2_get_number_of_pools_fun_json(
      near_kit_client(),
      HUGGIES_RHEA_AMM_CONTRACT_ID,
    );
  } catch (err) {
    errors.push(
      `pool count: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  for (
    let offset = 0;
    offset < total_pools;
    offset += HUGGIES_RHEA_AMM_BATCH_SIZE
  ) {
    const limit = Math.min(
      HUGGIES_RHEA_AMM_BATCH_SIZE,
      total_pools - offset,
    );
    try {
      const batch = await fetch_rhea_amm_batch_fun(offset, limit);
      pools = pools.concat(batch);
    } catch (err) {
      errors.push(
        `pools ${offset}-${offset + limit - 1}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      break;
    }
  }
  return { pools, total_pools, errors };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
