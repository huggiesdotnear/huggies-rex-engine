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
// a value below this rounds away to zero at two decimals, so it is
// shown as "0.00" rather than as a long tail of zeros. 0.01 is the
// smallest amount that still reads as a real number.
const HUGGIES_DUST_FLOOR = 0.01;
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
// --- WHY --- a value below 0.01 is shown as plain "0.00". the old
// rule grew the decimals to show the first significant digit, so a
// dust holding read "0.00000034" and its usd value read "$0.00000034"
// — eight digits of noise on a row whose real value is nothing. a
// balance that rounds away to zero IS zero as far as a reader is
// concerned, and the raw unit column still carries the exact figure.
function format_amount_fun(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  // below the display floor the value rounds to zero at two decimals.
  if (abs < HUGGIES_DUST_FLOOR) return "0.00";
  const fixed = value.toFixed(HUGGIES_MAX_DISPLAY_DECIMALS);
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
// as digits would imply a precision the data does not have. a price
// that is real but rounds away at two decimals is NOT a dash — it is
// "$0.00", which is what the amount formatter produces for it.
function format_usd_fun(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
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
