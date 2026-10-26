// ========================================
// the one token amount presentation used by every place that shows a
// token amount: the human decimal amount and the usd value. the account
// balance rows and the token holders table both render through this, so
// the two cannot drift.
import { HUGGIES_AMOUNT_FORMAT } from "./token_amount_format";
import type { HUGGIES_TOKEN_INFO } from "./token_info";
// ========================================

// ========================================
// --- SHAPE ------------------------------
// the two amounts a token row shows, both already formatted for
// display. `usd` is the em dash string when the price is unknown.
export interface HUGGIES_TOKEN_AMOUNT_DISPLAY {
  decimal: string;
  usd: string;
}
// ========================================
// --- BUILD ------------------------------
// build the unified amount display for one raw balance.
export function token_amount_display_fun(
  raw: string,
  info: Pick<HUGGIES_TOKEN_INFO, "decimals" | "price_usd">,
): HUGGIES_TOKEN_AMOUNT_DISPLAY {
  return {
    decimal: HUGGIES_AMOUNT_FORMAT.balance(raw, info),
    usd: HUGGIES_AMOUNT_FORMAT.usd(
      HUGGIES_AMOUNT_FORMAT.balance_usd(raw, info),
    ),
  };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
