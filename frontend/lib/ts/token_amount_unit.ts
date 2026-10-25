// ========================================
// format a raw smallest-unit token amount as the on-chain integer,
// with thousands separators so a long balance stays readable.
// ========================================

// ========================================
// group the integer part of a digit string with thousands separators.
function group_digits_fun(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
// ========================================
// render the raw on-chain unit amount as a display string.
export function format_token_unit_fun(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "0";
  // a negative raw balance is not a thing on chain, but the sign is
  // carried through rather than dropped.
  const negative = trimmed.startsWith("-");
  const digits = negative ? trimmed.slice(1) : trimmed;
  if (!/^\d+$/.test(digits)) return trimmed;
  return `${negative ? "-" : ""}${group_digits_fun(digits)}`;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
