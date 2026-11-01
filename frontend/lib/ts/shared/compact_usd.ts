// ========================================
// the compact usd figure a dex header shows.
//
// --- WHY --- the header shows the size of a whole dex. the exact
// figure is $33,556,142 — nine characters and a sign — and on a 500px
// phone column that wraps onto two lines and reads as a mistake. a dex
// size does not need cents either.
//
// so a figure over a million is shortened to $33.6M, over a thousand to
// $12.3K, and under a thousand is shown in full with no decimals.
//
// it lives on its own because BOTH dex pages show the same numbers and
// neither of them owns the rule.
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the figures at and above these are shortened.
const HUGGIES_COMPACT_MILLION = 1_000_000;
const HUGGIES_COMPACT_THOUSAND = 1_000;
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// a compact usd figure, e.g. "$33.6M", "$12.3K", "$840".
export function compact_usd_fun(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= HUGGIES_COMPACT_MILLION) {
    return `${sign}$${(abs / HUGGIES_COMPACT_MILLION).toFixed(1)}M`;
  }
  if (abs >= HUGGIES_COMPACT_THOUSAND) {
    return `${sign}$${(abs / HUGGIES_COMPACT_THOUSAND).toFixed(1)}K`;
  }
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}
// ========================================
// copyright 2026 by sleet.near
