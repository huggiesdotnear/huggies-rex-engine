// ========================================
// raw token amounts are integers in the token's smallest unit, so they
// only mean something once divided by 10**decimals. every place that
// shows an amount goes through here, so a balance is never rendered as
// "1500000" next to a ticker called USDC.
import type { HUGGIES_TOKEN_INFO } from "./token_info";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// decimals for ordinary values (>= 0.01). large amounts read better
// with fewer, so they get their own smaller cap.
const HUGGIES_MAX_DISPLAY_DECIMALS = 2;
// dust gets up to 12 decimals: the floor that decides whether a price
// the most decimals a tiny amount may expand to. must cover the full
// exponent range of a 24-decimal token: a real holding can be as small
// as 1e-24, and a cap below that renders a non-zero balance as "0".
// 24 is the protocol maximum for NEAR-family tokens.
const HUGGIES_DUST_MAX_DECIMALS = 24;
// a usd value at or below this is noise rather than a price, and shows
// as an em dash. deliberately separate from the decimal cap above: an
// amount is real even when it is microscopic, but a "price" that small
// is not worth digits.
const HUGGIES_USD_FLOOR = 1e-12;
// ========================================
// ========================================
// --- HELPERS ----------------------------
// raw token amounts are integers in the token's smallest unit, so they
// only mean something once divided by 10**decimals. every place that
// shows an amount goes through here, so a balance is never rendered as
// "1500000" next to a ticker called USDC.
// --- WHY --- done with Number + 10**n rather than BigInt: a raw 24-decimal
// value exceeds Number's exact integer range, but we only ever display a
// handful of decimals, so the precision lost is below what we render.
function raw_to_human_fun(raw: string, decimals: number): number {
  const scaled = Number(raw);
  if (!Number.isFinite(scaled)) return 0;
  if (!Number.isInteger(decimals) || decimals <= 0) return scaled;
  return scaled / 10 ** decimals;
}
// ========================================
// group an integer part with thousands separators so long balances
// stay readable.
function group_digits_fun(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
// ========================================
// render a number with thousands separators and a bounded number of
// decimals, trimming trailing zeros.
// --- WHY --- decimal count is chosen from the value's magnitude: a
// fixed toFixed(n) turns a real $0.00000012 price into a bare "0",
// which reads as "no price" for a token that does have one. so small
// values expand (capped) while ordinary and large ones stay at two
// decimals, which is all a balance or usd figure needs.
function format_amount_fun(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  let decimals: number;
  if (abs === 0 || abs >= 0.01) {
    decimals = HUGGIES_MAX_DISPLAY_DECIMALS;
  } else {
    // enough decimals to show the first significant digit.
    const needed = Math.ceil(-Math.log10(abs)) + 1;
    decimals = Math.min(needed, HUGGIES_DUST_MAX_DECIMALS);
  }
  const fixed = value.toFixed(decimals);
  const trimmed = fixed.includes(".")
    ? fixed.replace(/0+$/, "").replace(/\.$/, "")
    : fixed;
  const [whole, fraction] = trimmed.split(".");
  const grouped = group_digits_fun(whole);
  return fraction === undefined || fraction.length === 0
    ? grouped
    : `${grouped}.${fraction}`;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// convert a raw balance to its human-readable string for display.
function format_balance_fun(
  raw: string,
  info: Pick<HUGGIES_TOKEN_INFO, "decimals">,
): string {
  return format_amount_fun(raw_to_human_fun(raw, info.decimals));
}
// ========================================
// a usd figure, or an em dash when the price is unknown/zero so we do
// not print "$0.00" for a token we simply have no price for.
// --- WHY --- the floor catches a price so small it is numerically
// meaningless: 1e-30 is not "$0.000...", it is nothing, and showing it
// as digits would imply a precision the data does not have.
function format_usd_fun(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) < HUGGIES_USD_FLOOR) {
    return "—";
  }
  const sign = value < 0 ? "-" : "";
  return `${sign}$${format_amount_fun(Math.abs(value))}`;
}
// ========================================
// the usd worth of a raw balance: human amount × price.
function balance_usd_fun(
  raw: string,
  info: Pick<HUGGIES_TOKEN_INFO, "decimals" | "price_usd">,
): number {
  return raw_to_human_fun(raw, info.decimals) * info.price_usd;
}
// ========================================
// the whole display surface in one object.
export const HUGGIES_AMOUNT_FORMAT = {
  balance: format_balance_fun,
  usd: format_usd_fun,
  balance_usd: balance_usd_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================