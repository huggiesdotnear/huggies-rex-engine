// ========================================
// data loader for the Rhea DCL v2 contract page.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import { near_kit_contract_view_fun_json } from "../../../middleman/near_kit_tool_box";
// ========================================
const HUGGIES_RHEA_DCL_CONTRACT_ID = "dclv2.ref-labs.near";
// how many pools one `list_pools` call returns.
const HUGGIES_RHEA_DCL_BATCH_SIZE = 500;
// ========================================
export interface HUGGIES_RHEA_DCL_POOL {
  pool_id: string;
  token_x: string;
  token_y: string;
  total_x: string;
  total_y: string;
  total_liquidity: string;
  fee: number;
  state: string;
}
export interface HUGGIES_RHEA_DCL_DATA {
  pools: HUGGIES_RHEA_DCL_POOL[];
  total_pools: number;
  errors: string[];
}
// ========================================
// fetch one page of Rhea DCL pools.
async function fetch_rhea_dcl_batch_fun(
  from_index: number,
  limit: number,
): Promise<HUGGIES_RHEA_DCL_POOL[]> {
  const near = near_kit_client();
  const raw = await near_kit_contract_view_fun_json<
    Array<{
      pool_id: string;
      token_x: string;
      token_y: string;
      total_x: string;
      total_y: string;
      total_liquidity: string;
      fee: number;
      state: string;
    }>
  >(near, HUGGIES_RHEA_DCL_CONTRACT_ID, "list_pools", {
    from_index,
    limit,
  });
  return raw.map((pool) => ({
    pool_id: pool.pool_id,
    token_x: pool.token_x,
    token_y: pool.token_y,
    total_x: pool.total_x,
    total_y: pool.total_y,
    total_liquidity: pool.total_liquidity,
    fee: typeof pool.fee === "number" ? pool.fee : 0,
    state: pool.state,
  }));
}
// ========================================
// load every Rhea DCL pool, in batches.
// --- WHY --- the contract has no pool-count view, so the pages are
// walked until one comes back short — that short page is the end.
export async function load_rhea_dcl_page_fun(): Promise<HUGGIES_RHEA_DCL_DATA> {
  const errors: string[] = [];
  let pools: HUGGIES_RHEA_DCL_POOL[] = [];

  for (let offset = 0; ; offset += HUGGIES_RHEA_DCL_BATCH_SIZE) {
    try {
      const batch = await fetch_rhea_dcl_batch_fun(
        offset,
        HUGGIES_RHEA_DCL_BATCH_SIZE,
      );
      pools = pools.concat(batch);
      if (batch.length < HUGGIES_RHEA_DCL_BATCH_SIZE) break;
    } catch (err) {
      errors.push(
        `pools ${offset}-${offset + HUGGIES_RHEA_DCL_BATCH_SIZE - 1}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      break;
    }
  }
  return { pools, total_pools: pools.length, errors };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
