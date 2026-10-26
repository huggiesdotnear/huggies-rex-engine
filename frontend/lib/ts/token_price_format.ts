// ========================================
// format a usd price for a metadata row.
// ========================================
import { HUGGIES_AMOUNT_FORMAT } from "./token_amount_format";
// ========================================
// format a usd price with two decimals, and "0.00" for one that is
// real but rounds away.
// --- WHY --- the shared amount formatter used to grow the decimals as a
// value got smaller, so a price like 0.00000012 kept all its digits. on
// a metadata row that is noise — the price is "nothing" at that scale —
// and a token's real price is shown on its own row anyway.
export function format_price_usd_fun(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return "—";
  }
  return HUGGIES_AMOUNT_FORMAT.usd(value);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
