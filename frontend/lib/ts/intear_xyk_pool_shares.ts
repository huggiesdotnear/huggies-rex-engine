// ========================================
// typed local helper for INTEAR DEX XYK account LP shares.
// ========================================
import {
  borsh_bytes_fun,
  read_option_u128_vec_fun,
  write_string_fun,
  write_u32_vec_fun,
} from "./intear_dex_borsh";
import { intear_dex_view_fun } from "./intear_dex_view";
// ========================================
const HUGGIES_INTEAR_XYK_DEX_ID = "slimedragon.near/xyk";
// ========================================
// fetch an account's shares in a list of INTEAR XYK pools.
export async function intear_xyk_pool_shares_fun(
  account_id: string,
  pool_ids: ReadonlyArray<number>,
): Promise<ReadonlyArray<string | null>> {
  const chunks: Uint8Array[] = [];
  write_u32_vec_fun(chunks, pool_ids);
  write_string_fun(chunks, account_id);
  const bytes = await intear_dex_view_fun(
    HUGGIES_INTEAR_XYK_DEX_ID,
    "get_pool_shares",
    borsh_bytes_fun(chunks),
  );
  return read_option_u128_vec_fun(bytes);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
