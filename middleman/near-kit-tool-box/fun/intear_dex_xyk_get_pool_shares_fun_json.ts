// ========================================
// INTEAR_DEX_XYK_GET_POOL_SHARES_FUN_JSON
// View: the xyk dex's `get_pool_shares`. Returns the LP shares
// `account_id` holds in each of `pool_ids`, in the order the pools
// were asked for.
//
// each entry is `{ shares }`:
//   - `shares: null`   — the pool is not a public pool, or the
//                        account has no entry in it
//   - `shares: "0"`    — the account is registered but holds nothing
//   - `shares: "123"`  — the account holds that many shares
//
// the shares are the LP tokens of the pool. a share is worth its
// pro-rata part of the pool's two assets.
//
// it replaces frontend/lib/ts/intear_xyk_pool_shares.ts.
// ========================================
import type { Near } from "near-kit";
import { BorshWriter } from "../stuff/near_kit_borsh";
import { near_kit_intear_dex_view_fun } from "../stuff/near_kit_intear_dex_view";
import { near_kit_read_intear_pool_share_fun } from "../stuff/near_kit_intear_dex_xyk_decode";
import type { intear_dex_xyk_args } from "../types/near_kit_args";
import type { INTEAR_DEX_XYK_POOL_SHARES_TYPE } from "../types/intear_dex_xyk_types";
// ========================================
// fetch an account's shares in a list of INTEAR XYK pools.
export async function intear_dex_xyk_get_pool_shares_fun_json(
  near: Near,
  engine_contract_id: string,
  dex_id: string,
  pool_ids: intear_dex_xyk_args["pool_ids"],
  account_id: intear_dex_xyk_args["account_id"],
): Promise<INTEAR_DEX_XYK_POOL_SHARES_TYPE> {
  const writer = new BorshWriter();
  writer.vec(pool_ids, (item, pool_id) => item.u32(pool_id));
  writer.string(account_id);
  return near_kit_intear_dex_view_fun(
    near,
    engine_contract_id,
    dex_id,
    "get_pool_shares",
    writer.toBytes(),
    (reader) => reader.vec((item) => near_kit_read_intear_pool_share_fun(item)),
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
