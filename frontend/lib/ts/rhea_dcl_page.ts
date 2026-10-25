// ========================================
// data loader for the Rhea DCL v2 contract page.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import { near_kit_contract_view_fun_json } from "../../../middleman/near_kit_tool_box";
// ========================================
const HUGGIES_RHEA_DCL_POOL_LIMIT = 500;
// ========================================
export interface HUGGIES_RHEA_DCL_POOL {
  pool_id: string;
  token_x: string;
  token_y: string;
  total_x: string;
  total_y: string;
  total_liquidity: string;
  state: string;
}
export interface HUGGIES_RHEA_DCL_DATA {
  pools: HUGGIES_RHEA_DCL_POOL[];
  errors: string[];
}
// ========================================
// load the live Rhea DCL v2 pool collection.
export async function load_rhea_dcl_page_fun(): Promise<HUGGIES_RHEA_DCL_DATA> {
  const contract_id = "dclv2.ref-labs.near";
  const near = near_kit_client();
  const errors: string[] = [];
  let pools: HUGGIES_RHEA_DCL_POOL[] = [];

  try {
    const raw = await near_kit_contract_view_fun_json<
      Array<{
        pool_id: string;
        token_x: string;
        token_y: string;
        total_x: string;
        total_y: string;
        total_liquidity: string;
        state: string;
      }>
    >(near, contract_id, "list_pools", {
      from_index: 0,
      limit: HUGGIES_RHEA_DCL_POOL_LIMIT,
    });
    pools = raw;
  } catch (err) {
    errors.push(`pools: ${err instanceof Error ? err.message : String(err)}`);
  }
  return { pools, errors };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
