// ========================================
// INTEAR_DEX_XYK_GET_POOLS_FUN_JSON
// View: the xyk dex's `get_pools`. Returns the pools of the dex,
// starting at `start_index`, at most `limit` of them.
//
// each pool is decoded into the `kind`, `assets` and `total_shares`
// fields the contract page needs; the fee fields of the decoded
// `PoolView` are skipped.
// ========================================
import type { Near } from "near-kit";
import { BorshWriter } from "../stuff/near_kit_borsh";
import { near_kit_intear_dex_view_fun } from "../stuff/near_kit_intear_dex_view";
import { near_kit_read_intear_pool_view_fun } from "../stuff/near_kit_intear_dex_xyk_decode";
import type { INTEAR_DEX_XYK_POOL_VIEW_TYPE } from "../types/intear_dex_xyk_types";
// ========================================
// fetch a page of INTEAR XYK pools.
export async function intear_dex_xyk_get_pools_fun_json(
  near: Near,
  engine_contract_id: string,
  dex_id: string,
  start_index: number,
  limit: number,
): Promise<INTEAR_DEX_XYK_POOL_VIEW_TYPE[]> {
  const writer = new BorshWriter();
  writer.u32(start_index);
  writer.u32(limit);
  return near_kit_intear_dex_view_fun(
    near,
    engine_contract_id,
    dex_id,
    "get_pools",
    writer.toBytes(),
    (reader) => reader.vec((item) => near_kit_read_intear_pool_view_fun(item)),
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
