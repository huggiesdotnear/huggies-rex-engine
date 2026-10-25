// ========================================
// NEAR_KIT_CONTRACT_VIEW_FUN
// the generic typed contract view helper. one view method call, one
// typed result.
//
// this is the local stand-in for the generic view helper of
// @near-kit-tool-box/fun: the published package does not carry a
// catch-all view yet, so the folder keeps one under the same shape.
//
// it replaces frontend/lib/ts/contract_view.ts.
// ========================================
import { near_kit_contract_view_fun } from "../stuff/near_kit_contract_view";
// ========================================
// call one contract view method and reject empty or malformed JSON.
export async function near_kit_contract_view_fun_json<T>(
  near: import("near-kit").Near,
  contract_id: string,
  method_name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  return near_kit_contract_view_fun<T>(near, contract_id, method_name, args);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
