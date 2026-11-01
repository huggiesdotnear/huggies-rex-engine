// ========================================
// the share of a token's total supply that a raw balance holds.
//
// --- WHY --- this lives in its own file: the $SHIT page worked this out
// in TWO places already — once for the holder rows and once for the
// holder groups — and the burn page worked it out a third time. three
// copies of the same arithmetic is three places to fix a bug in.
//
// the api reports the total supply as a decimal string in the token's
// smallest unit, and a raw balance is the same kind of number, so both
// are exact big integers and the ratio is exact too.
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the share of the total supply a raw balance holds, in percent.
//
// --- WHY --- the math runs on BigInt: the raw balance and the raw supply
// are both 18-decimal integers, so the ratio is computed on BigInt and only
// then scaled to a percent. doing it in floating point loses the
// sub-0.001% rows the pages still have to show.
//
// --- WHY --- a malformed value reads as zero rather than throwing: a token
// with a broken supply must not take a page down, and a zero share is the
// honest answer for a number we cannot read.
function supply_percent_fun(raw: string, total_supply_raw: string): number {
  let raw_big = 0n;
  let supply_big = 0n;
  try {
    raw_big = BigInt(raw);
  } catch {
    raw_big = 0n;
  }
  try {
    supply_big = BigInt(total_supply_raw);
  } catch {
    supply_big = 0n;
  }
  if (supply_big <= 0n) return 0;
  const scaled = (raw_big * 10_000n) / supply_big;
  return Number(scaled) / 100;
}
// ========================================
// format the share of the total supply: two decimals above 0.01%,
// three above 0.001%, and "<0.001%" for the dust below that.
function format_supply_percent_fun(percent: number): string {
  if (percent >= 0.01) return `${percent.toFixed(2)}%`;
  if (percent >= 0.001) return `${percent.toFixed(3)}%`;
  return "<0.001%";
}
// ========================================
// --- PUBLIC -----------------------------
// the whole supply-share surface, so every page reads it the same way.
export const HUGGIES_SUPPLY_PERCENT = {
  percent: supply_percent_fun,
  format: format_supply_percent_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
