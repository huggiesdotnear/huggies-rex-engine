// ========================================
// build a relative link to the transaction page, and to the queue page.
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
// --- WHY THE QUEUE LINK LIVES HERE AND NOT IN ITS OWN FILE: the queue
// is a third thing that gets linked to, and it is linked to from the
// feed — so it is a link builder beside the other two, and one import
// finds every link the app builds.
//
// depth is the number of directories below frontend/app/ that the
// linking page sits in, so depth 0 -> "tx.html?tx=..." and depth 1 ->
// "../tx.html?tx=..." (both land on frontend/app/tx.html).
// ========================================
export function tx_detail_href_fun(tx_hash: string, depth: number = 0): string {
  const prefix = "../".repeat(Math.max(0, depth));
  return `${prefix}tx.html?tx=${encodeURIComponent(tx_hash)}`;
}

// the link to the queue page, for one queued batch.
//
// --- WHY --- the queue id is url-encoded: it is a uuid today, but it
// goes into a url parameter and a raw one would have to be escaped by
// hand.
export function queue_detail_href_fun(
  queue_id: string,
  depth: number = 0,
): string {
  const prefix = "../".repeat(Math.max(0, depth));
  return `${prefix}queue.html?queue=${encodeURIComponent(queue_id)}`;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
