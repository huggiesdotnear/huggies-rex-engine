// ========================================
// typed local helper for the INTEAR DEX XYK pool count.
// ========================================
import { read_u32_fun } from "./intear_dex_borsh";
import { intear_dex_view_fun } from "./intear_dex_view";
// ========================================
const HUGGIES_INTEAR_XYK_DEX_ID = "slimedragon.near/xyk";
// ========================================
// fetch how many pools the INTEAR XYK sub-dex contains.
export async function intear_xyk_pool_count_fun(): Promise<number> {
  const bytes = await intear_dex_view_fun(
    HUGGIES_INTEAR_XYK_DEX_ID,
    "get_pool_count",
    new Uint8Array(),
  );
  return read_u32_fun(bytes, 0);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
