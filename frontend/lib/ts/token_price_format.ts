// ========================================
// format a usd price so a small one never reads as a bare zero.
// ========================================
import { HUGGIES_AMOUNT_FORMAT } from "./token_amount_format";
// ========================================
// the smallest price that is shown as a number rather than a dash.
const HUGGIES_PRICE_FLOOR = 1e-12;
// ========================================
// format a usd price with enough decimals to show its first digit.
// --- WHY --- `toLocaleString` rounds a price like 0.00000012 to "0",
// which reads as "this token has no price" when it does. the shared
// amount formatter already grows the decimals as a value gets
// smaller, so a price uses the same rule as a balance.
export function format_price_usd_fun(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) < HUGGIES_PRICE_FLOOR) {
    return "—";
  }
  return HUGGIES_AMOUNT_FORMAT.usd(value);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
