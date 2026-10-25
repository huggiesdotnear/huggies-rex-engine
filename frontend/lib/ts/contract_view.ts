// ========================================
// typed helper for calling NEAR contract view methods.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
// ========================================
// call one contract view method and reject empty or malformed JSON.
export async function contract_view_fun<T>(
  contract_id: string,
  method_name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const result = await near_kit_client().view<T>(
    contract_id,
    method_name,
    args,
  );
  if (result === undefined) {
    throw new Error(`${contract_id}.${method_name} returned no value`);
  }
  return result;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
