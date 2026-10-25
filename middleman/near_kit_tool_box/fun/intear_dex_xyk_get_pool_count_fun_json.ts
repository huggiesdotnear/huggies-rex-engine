// ========================================
// INTEAR_DEX_XYK_GET_POOL_COUNT_FUN_JSON
// View: the xyk dex's `get_pool_count`. Returns how many pools the
// dex holds. the count is the pool id of the next pool to be
// created, so valid pool ids run `0 .. count - 1`.
//
// it replaces frontend/lib/ts/intear_xyk_pool_count.ts.
// ========================================
import type { Near } from "near-kit";
import { near_kit_intear_dex_view_fun } from "../stuff/near_kit_intear_dex_view";
// ========================================
// fetch how many pools the INTEAR XYK sub-dex contains.
export async function intear_dex_xyk_get_pool_count_fun_json(
  near: Near,
  engine_contract_id: string,
  dex_id: string,
): Promise<number> {
  return near_kit_intear_dex_view_fun(
    near,
    engine_contract_id,
    dex_id,
    "get_pool_count",
    new Uint8Array(),
    (reader) => reader.u32(),
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
