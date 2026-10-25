// ========================================
// typed local helper for INTEAR DEX engine sub-dex views.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import { base64_to_bytes_fun, bytes_to_base64_fun } from "./intear_dex_borsh";
// ========================================
// call an INTEAR DEX sub-dex view through the engine and return raw bytes.
export async function intear_dex_view_fun(
  dex_id: string,
  method_name: string,
  args: Uint8Array,
): Promise<Uint8Array> {
  const value = await near_kit_client().view<unknown>(
    "dex.intear.near",
    "dex_view",
    {
      dex_id,
      method: method_name,
      args: bytes_to_base64_fun(args),
    },
  );
  if (typeof value !== "string") {
    throw new Error("INTEAR dex_view did not return a base64 string");
  }
  return base64_to_bytes_fun(value);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
