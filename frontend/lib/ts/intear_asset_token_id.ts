// ========================================
// resolve the token metadata id for an INTEAR DEX asset id.
// ========================================
import { intear_asset_id_fun } from "./intear_asset_id";
// ========================================
// return the contract id used to look up token metadata.
export function intear_asset_token_id_fun(asset_id: string): string {
  const parsed = intear_asset_id_fun(asset_id);
  if (parsed.kind === "near") return "near";
  if (parsed.contract_id === null) {
    throw new Error(`INTEAR asset id has no token contract: ${asset_id}`);
  }
  return parsed.contract_id;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
