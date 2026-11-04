// ========================================
// build a link to the swap page, for one queued swap.
//
// a queued swap has NO detail page of its own. the tx queue has one —
// the queue page shows every call of a batch — but a queued swap has no
// calls yet: the agent named a token in, an amount in and a token out,
// and the route is worked out when it is executed. so the swap's home
// IS the swap page, and the link carries the swap's pair and its amount.
//
// --- WHY THE SWAP ID RIDES ALONG: the swap page can load the queued
// swap from the backend and show the reader exactly what was queued, and
// when the reader executes it the result is reported back to THAT swap.
// a link with only the pair and the amount would be a link to a fresh
// swap, and the reader's send would not be recorded against anything.
//
// --- WHY THE AMOUNT IS THE RAW UNIT AMOUNT: the url carries the exact
// number of the token's smallest unit that trades, so it means the same
// thing whatever the token's decimals are. this is the same rule the
// swap page's own url follows.
//
// depth is the number of directories below frontend/app/ that the
// linking page sits in, so depth 0 -> "swap.html?..." and depth 1 ->
// "../swap.html?..." (both land on frontend/app/swap.html).
//
// --- WHY IT LIVES IN shared/ AND NOT IN THE FEED'S FOLDER: the feed
// links to it, and so does anything else that wants to point at a
// queued swap. one builder, one rule for the link.
export function swap_quote_href_fun(
  swap_id: string,
  token_in: string,
  token_out: string,
  amount_in: string,
  depth: number = 0,
): string {
  const prefix = "../".repeat(Math.max(0, depth));
  const params = new URLSearchParams();
  params.set("in", token_in);
  params.set("out", token_out);
  params.set("amount_in", amount_in);
  params.set("swap", swap_id);
  return `${prefix}swap.html?${params.toString()}`;
}
// ========================================
// copyright 2026 by sleet.near
