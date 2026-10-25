// ========================================
// build a relative token-detail link for pages at any nesting depth.
// depth is the number of directories below frontend/app/ that the
// linking page sits in, so depth 0 -> "tokens/token.html?id=..." and
// depth 1 -> "../tokens/token.html?id=..." (both land on
// frontend/app/tokens/token.html).
// ========================================
export function token_detail_href_fun(
  token_id: string,
  depth: number = 0,
): string {
  const prefix = "../".repeat(Math.max(0, depth));
  return `${prefix}tokens/token.html?id=${encodeURIComponent(token_id)}`;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
