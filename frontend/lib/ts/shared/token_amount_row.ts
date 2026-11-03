// ========================================
// the one token amount presentation used by every place that shows a
// token amount: the human decimal amount and the usd value. the account
// balance rows and the token holders table both render through this, so
// the two cannot drift.
import { SHIT_1170_AMOUNT_FORMAT } from "./token_amount_format";
import type { SHIT_1170_TOKEN_INFO } from "./token_info";
// ========================================

// ========================================
// --- SHAPE ------------------------------
// the two amounts a token row shows, both already formatted for display.
// `usd` is the em dash string when the price is unknown.
export interface SHIT_1170_TOKEN_AMOUNT_DISPLAY {
  decimal: string;
  usd: string;
}
// ========================================
// --- BUILD ------------------------------
// build the unified amount display for one raw balance.
export function token_amount_row_fun(
  raw: string,
  info: Pick<SHIT_1170_TOKEN_INFO, "decimals" | "price_usd">,
): SHIT_1170_TOKEN_AMOUNT_DISPLAY {
  return {
    decimal: SHIT_1170_AMOUNT_FORMAT.balance(raw, info),
    usd: SHIT_1170_AMOUNT_FORMAT.usd(
      SHIT_1170_AMOUNT_FORMAT.balance_usd(raw, info),
    ),
  };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
