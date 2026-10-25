// ========================================
// INTEAR_DEX_ENGINE_DEX_VIEW_FUN_JSON
// View: the engine's `dex_view`. Calls a view method of a sub-dex
// and returns its raw **borsh** response bytes.
//
// use the typed sub-dex helpers (`intear_dex_xyk_*`) instead whenever
// one covers the method — they decode the response for you.
//
// the method name `swap` is reserved by the engine and is rejected
// here; swaps go through `swap_simple` or `dex_call`.
//
// the `args` are the sub-dex's borsh-encoded arguments. pass an empty
// `Uint8Array` for methods that take none.
//
// it replaces frontend/lib/ts/intear_dex_view.ts.
// ========================================
import type { Near } from "near-kit";
import { near_kit_intear_dex_view_raw_fun } from "../stuff/near_kit_intear_dex_view";
// ========================================
// call a sub-dex view through the engine and return raw bytes.
export async function intear_dex_engine_dex_view_fun_json(
  near: Near,
  engine_contract_id: string,
  dex_id: string,
  method: string,
  args: Uint8Array,
): Promise<Uint8Array> {
  return near_kit_intear_dex_view_raw_fun(
    near,
    engine_contract_id,
    dex_id,
    method,
    args,
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
