// ========================================
// data loader for the Rhea DCL v2 contract page.
// ========================================
import { contract_view_fun } from "./contract_view";
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
  assets: Record<string, string>;
  liquidities: Array<Record<string, unknown>>;
  errors: string[];
}
// ========================================
// load DCL pools, active-account assets, and active-account liquidity views.
export async function load_rhea_dcl_page_fun(
  account_id: string | null,
): Promise<HUGGIES_RHEA_DCL_DATA> {
  const contract_id = "dclv2.ref-labs.near";
  const errors: string[] = [];
  let pools: HUGGIES_RHEA_DCL_POOL[] = [];
  let assets: Record<string, string> = {};
  let liquidities: Array<Record<string, unknown>> = [];

  try {
    const raw = await contract_view_fun<
      Array<{
        pool_id: string;
        token_x: string;
        token_y: string;
        total_x: string;
        total_y: string;
        total_liquidity: string;
        state: string;
      }>
    >(contract_id, "list_pools", {
      from_index: 0,
      limit: HUGGIES_RHEA_DCL_POOL_LIMIT,
    });
    pools = raw;
  } catch (err) {
    errors.push(`pools: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (account_id !== null) {
    try {
      assets = await contract_view_fun<Record<string, string>>(
        contract_id,
        "list_user_assets",
        { account_id, from_index: 0, limit: 500 },
      );
    } catch (err) {
      errors.push(
        `assets: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    try {
      const raw = await contract_view_fun<Array<Record<string, unknown>>>(
        contract_id,
        "list_liquidity_views",
        { account_id, from_index: 0, limit: 500 },
      );
      liquidities = raw;
    } catch (err) {
      errors.push(
        `liquidities: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  return { pools, assets, liquidities, errors };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
