// ========================================
// build a relative link to the transaction page.
//
// it is the sibling of lib/ts/shared/token_link.ts: the token page has
// a link builder, so the transaction page gets one too, and a page at
// any nesting depth can link to a transaction.
//
// --- WHY IT LIVES IN shared/ AND NOT IN THE ACCOUNT FOLDER: the
// account page was its first user, but the swap page's toast layer
// links to transactions too, and a file more than one page needs
// belongs in shared/.
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
