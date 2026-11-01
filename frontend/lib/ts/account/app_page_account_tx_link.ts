// ========================================
// build a relative link to the transaction page.
//
// it is the sibling of lib/ts/token_link.ts: the token page has a link
// builder, so the transaction page gets one too, and a page at any
// nesting depth can link to a transaction.
//
// depth is the number of directories below frontend/app/ that the
// linking page sits in, so depth 0 -> "tx.html?tx=..." and depth 1 ->
// "../tx.html?tx=..." (both land on frontend/app/tx.html).
// ========================================
export function tx_detail_href_fun(tx_hash: string, depth: number = 0): string {
  const prefix = "../".repeat(Math.max(0, depth));
  return `${prefix}tx.html?tx=${encodeURIComponent(tx_hash)}`;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
