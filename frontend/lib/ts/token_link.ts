// ========================================
// build a relative token-detail link for pages at any nesting depth.
// depth is the number of directories below frontend/app/ that the
// linking page sits in, so depth 0 -> "token/?id=..." and
// depth 1 -> "../token/?id=..." (both land on
// frontend/app/token/index.html).
// ========================================
export function token_detail_href_fun(
  token_id: string,
  depth: number = 0,
): string {
  const prefix = "../".repeat(Math.max(0, depth));
  return `${prefix}token/?id=${encodeURIComponent(token_id)}`;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
