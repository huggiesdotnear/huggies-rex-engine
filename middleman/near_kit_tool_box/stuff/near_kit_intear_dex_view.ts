// ========================================
// NEAR_KIT_INTEAR_DEX_VIEW
// shared plumbing for reading a sub-dex view through the INTEAR DEX
// engine.
//
// the engine's `dex_view` view takes a JSON envelope:
//   { "dex_id": "<deployer>/<id>", "method": "<name>", "args": "<base64>" }
//
// where `args` are the sub-dex's **borsh**-encoded arguments, and it
// returns a base64 string holding the sub-dex's **borsh**-encoded
// response.
//
// `dex_view` refuses the method name `swap` — that one goes through
// the engine's `swap_simple` / `dex_call` paths instead.
// ========================================
import type { Near } from "near-kit";
import {
  BorshReader,
  base64_to_bytes_fun,
  bytes_to_base64_fun,
} from "./near_kit_borsh";
// ========================================
// the contract id of the INTEAR DEX engine on mainnet.
export const NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID = "dex.intear.near";

// ========================================
// the mainnet xyk sub-dex of the INTEAR DEX engine. a dex id is
// `<deployer>/<id>` — the account that deployed the dex code and the
// name it was deployed under.
export const NEAR_KIT_INTEAR_DEX_XYK_DEX_ID = "slimedragon.near/xyk";

// ========================================
// call a sub-dex view through the engine and return the raw borsh
// bytes of the response.
export async function near_kit_intear_dex_view_raw_fun(
  near: Near,
  engine_contract_id: string,
  dex_id: string,
  method: string,
  args: Uint8Array,
): Promise<Uint8Array> {
  if (method === "swap") {
    throw new Error(
      "intear dex: the method name 'swap' is reserved by the engine and cannot be called through dex_view",
    );
  }
  const result = await near.view<unknown>(engine_contract_id, "dex_view", {
    dex_id,
    method,
    args: bytes_to_base64_fun(args),
  });
  if (typeof result !== "string") {
    throw new Error(
      `intear dex: expected a base64 string from dex_view for ${dex_id} ${method}, got ${typeof result}`,
    );
  }
  return base64_to_bytes_fun(result);
}

// ========================================
// call a sub-dex view through the engine and decode the borsh
// response with the supplied decoder.
export async function near_kit_intear_dex_view_fun<T>(
  near: Near,
  engine_contract_id: string,
  dex_id: string,
  method: string,
  args: Uint8Array,
  decode: (reader: BorshReader) => T,
): Promise<T> {
  const bytes = await near_kit_intear_dex_view_raw_fun(
    near,
    engine_contract_id,
    dex_id,
    method,
    args,
  );
  return decode(new BorshReader(bytes));
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
