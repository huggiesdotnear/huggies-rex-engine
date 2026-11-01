// ========================================
// turn a human amount ("1.5") into the unit amount the aggregator
// wants ("1500000000000000000000000"), and back.
//
// the router speaks in the token's SMALLEST UNIT. a human types
// "1.5", so every amount has to cross this boundary on its way in
// and on its way out.
//
// --- WHY IT LIVES HERE AND NOT IN token_amount_format.ts: that file
// renders an amount for a human to READ. this one converts an amount
// for the chain and the router to USE, and it has to be exact in a way
// a display formatter never is.
import type { HUGGIES_TOKEN_INFO } from "../shared/token_info";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// --- WHY --- BigInt and not Number: a 24-decimal NEAR amount is far
// beyond Number's exact integer range, so a Number round trip loses
// the low digits of a large balance. the human side is a string
// ("1.5"), so it is parsed digit by digit into integers.
function parse_decimal_parts_fun(value: string): {
  whole: bigint;
  fraction: string;
} | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  // only a plain decimal is accepted: digits, one dot, digits. no
  // exponent, no sign, no thousands separators.
  if (!/^\d*\.?\d*$/.test(trimmed)) return null;
  const [whole_part = "", fraction_part = ""] = trimmed.split(".");
  if (whole_part.length === 0 && fraction_part.length === 0) return null;
  return { whole: BigInt(whole_part.length === 0 ? "0" : whole_part), fraction: fraction_part };
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// the human amount as the unit amount.
//
// --- WHY --- the fraction is padded and truncated, not rounded: the
// unit amount is what the router will trade, so it must never be
// MORE than the reader asked for. rounding up would spend more than
// they typed.
export function human_to_unit_fun(human: string, decimals: number): string | null {
  if (!Number.isInteger(decimals) || decimals < 0) return null;
  const parts = parse_decimal_parts_fun(human);
  if (parts === null) return null;
  const whole = parts.whole * 10n ** BigInt(decimals);
  if (parts.fraction.length === 0) return whole.toString();
  // the fraction is scaled to the token's decimals. a fraction LONGER
  // than the decimals is cut, not rounded — see above.
  const kept = parts.fraction.slice(0, decimals).padEnd(decimals, "0");
  const fraction_value = BigInt(kept.length === 0 ? "0" : kept);
  return (whole + fraction_value).toString();
}
// ========================================
// the unit amount as the human amount.
//
// --- WHY --- this does NOT use the display formatter: the display
// formatter trims trailing zeros and drops anything under 0.01, which
// is right for a row of balances and wrong for an input the reader is
// about to trade. a swap of 0.0004 USDC must read as 0.0004 in the
// box, not as "0.00".
export function unit_to_human_fun(unit: string, decimals: number): string {
  const trimmed = unit.trim();
  if (!/^\d+$/.test(trimmed)) return "";
  if (!Number.isInteger(decimals) || decimals <= 0) return trimmed;
  const padded = trimmed.padStart(decimals + 1, "0");
  const whole = padded.slice(0, padded.length - decimals);
  const fraction = padded.slice(padded.length - decimals).replace(/0+$/, "");
  if (fraction.length === 0) return whole;
  return `${whole}.${fraction}`;
}
// ========================================
// the unit amount as the human amount, with the decimals the token
// actually has — used for the small "unit" line under an input.
//
// --- WHY --- a SEPARATE function and not unit_to_human_fun: the
// input box shows the tidied amount ("1.5"), while the small line
// under it shows the exact unit figure ("1500000000000000000000000"),
// which is what the chain sees. trimming zeros off the unit figure
// would hide the trailing zeros that make it the same number of
// units as the token's decimals.
export function unit_to_raw_human_fun(unit: string, decimals: number): string {
  const trimmed = unit.trim();
  if (!/^\d+$/.test(trimmed)) return "";
  if (!Number.isInteger(decimals) || decimals <= 0) return trimmed;
  const padded = trimmed.padStart(decimals + 1, "0");
  const whole = padded.slice(0, padded.length - decimals);
  const fraction = padded.slice(padded.length - decimals);
  return `${whole}.${fraction}`;
}
// ========================================
// the human amount's usd value, using the token's price.
//
// --- WHY --- the price is applied to the HUMAN amount and not to the
// unit amount: the price is quoted per whole token, so 1.5 USDC at
// $1.00 is $1.50. multiplying the unit amount by the price would be
// off by 10**decimals.
export function human_usd_fun(human: string, info: Pick<HUGGIES_TOKEN_INFO, "price_usd">): number {
  const value = Number(human);
  if (!Number.isFinite(value)) return 0;
  return value * info.price_usd;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
