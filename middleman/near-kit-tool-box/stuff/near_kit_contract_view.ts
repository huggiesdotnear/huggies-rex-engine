// ========================================
// NEAR_KIT_CONTRACT_VIEW
// the generic typed contract view helper every `fun/` helper in this
// folder builds on. one view method call, one typed result.
//
// it replaces frontend/lib/ts/contract_view.ts, which was the same
// helper scattered on its own.
// ========================================
import type { Near } from "near-kit";
// ========================================
// call one contract view method and reject empty or malformed JSON.
export async function near_kit_contract_view_fun<T>(
  near: Near,
  contract_id: string,
  method_name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const result = await near.view<T>(contract_id, method_name, args);
  if (result === undefined) {
    throw new Error(`${contract_id}.${method_name} returned no value`);
  }
  return result;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
