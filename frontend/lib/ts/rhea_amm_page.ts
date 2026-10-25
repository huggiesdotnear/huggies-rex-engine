// ========================================
// data loader for the Rhea AMM contract page.
// ========================================
import { contract_view_fun } from "./contract_view";
import { rhea_amm_pool_shares_batch_fun } from "./rhea_amm_pool_shares";
// ========================================
const HUGGIES_RHEA_AMM_POOL_LIMIT = 500;
const HUGGIES_RHEA_AMM_SHARE_BATCH_LIMIT = 100;
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
  deposits: Record<string, string>;
  shares: Record<string, string>;
  errors: string[];
}
// ========================================
// load Rhea pools, active-account deposits, and per-pool LP shares.
export async function load_rhea_amm_page_fun(
  account_id: string | null,
): Promise<HUGGIES_RHEA_AMM_DATA> {
  const contract_id = "v2.ref-finance.near";
  const errors: string[] = [];
  let pools: HUGGIES_RHEA_AMM_POOL[] = [];
  let deposits: Record<string, string> = {};
  const shares: Record<string, string> = {};

  try {
    const raw = await contract_view_fun<
      Array<{
        pool_kind: string;
        token_account_ids: string[];
        amounts: string[];
        shares_total_supply: string;
      }>
    >(contract_id, "get_pools", {
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

  if (account_id !== null) {
    try {
      const value = await contract_view_fun<Record<string, string>>(
        contract_id,
        "get_deposits",
        { account_id },
      );
      deposits = value;
    } catch (err) {
      errors.push(
        `deposits: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    for (
      let offset = 0;
      offset < pools.length;
      offset += HUGGIES_RHEA_AMM_SHARE_BATCH_LIMIT
    ) {
      const batch = pools.slice(
        offset,
        offset + HUGGIES_RHEA_AMM_SHARE_BATCH_LIMIT,
      );
      try {
        const values = await rhea_amm_pool_shares_batch_fun(
          batch.map((pool) => pool.pool_id),
          account_id,
        );
        values.forEach((value, index) => {
          const pool = batch[index];
          if (pool !== undefined) shares[String(pool.pool_id)] = value;
        });
      } catch (err) {
        errors.push(
          `shares ${offset}-${offset + batch.length - 1}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
  return { pools, deposits, shares, errors };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
