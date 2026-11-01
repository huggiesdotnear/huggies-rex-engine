// ========================================
// the swap page's amount in the OTHER direction: the reader types the
// amount they want OUT, and the router is asked how much IN it costs.
//
// the aggregator serves both questions. `AMOUNT_IN` says "I sell exactly
// this much" and answers with the amount out. `AMOUNT_OUT` says "I want
// exactly this much" and answers with the amount in. the page quotes
// on ONE side at a time, so this file holds the quote's SIDE — which
// side the reader is fixing — and the amount that side carries.
//
// --- WHY IT LIVES HERE AND NOT IN THE STORE: the store owns the
// quoting, but the SIDE is a fact about the reader's intent, and the
// amount maths needs it. keeping it here means the store, the form and
// the routes all read the same rule.
import type { HUGGIES_TOKEN_INFO } from "../shared/token_info";
// ========================================
// --- TYPES ------------------------------
// which side of the swap the reader is fixing.
export type HUGGIES_SWAP_AMOUNT_SIDE = "in" | "out";
// ========================================
// --- PUBLIC ---------------------------
// the human amount that belongs on the given side.
//
// --- WHY --- the side decides the token the amount is in: the "in"
// amount is in the token being sold, and the "out" amount is in the
// token being bought.
export function swap_side_amount_fun(
  side: HUGGIES_SWAP_AMOUNT_SIDE,
  amount_in: string,
  amount_out: string,
): string {
  return side === "in" ? amount_in : amount_out;
}
// ========================================
// the decimals of the token on the given side.
export function swap_side_decimals_fun(
  side: HUGGIES_SWAP_AMOUNT_SIDE,
  token_in_info: HUGGIES_TOKEN_INFO | null,
  token_out_info: HUGGIES_TOKEN_INFO | null,
): number {
  const info = side === "in" ? token_in_info : token_out_info;
  return info?.decimals ?? 0;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
