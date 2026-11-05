// ========================================
// the feed page's SWAP SEND: sign the queued swap the card is showing.
//
// the feed's SWAP NOW button does what the swap page's SWAP button
// does: it signs the route and records what came of it against the
// queued swap.
//
// --- WHY THE ROUTE COMES FROM THE CARD AND NOT FROM HERE: the card
// already holds the live route — the one it is showing the amount out
// of — and that is the route the reader is agreeing to. asking the
// router again here would be a second answer to a question the card has
// already answered, and the two could differ.
//
// --- WHY THE SEND ITSELF IS THE SHARED ONE: the swap page signs the
// same way, and the three-phase execution (swap legs, outcome check,
// fee legs only if owed) must not exist twice.
import { SHIT_1170_SWAP_SEND } from "../shared/swap_send";
import { SHIT_1170_AUTH } from "../shared/auth_status";
import { SHIT_1170_APP_PAGE_FEED_STORE } from "./app_page_feed_store";
import type { SHIT_1170_SWAP_QUEUE } from "@huggies/shit-1170-rex-engine-middleman";
import type { SHIT_1170_SWAP_ROUTE } from "../shared/swap_routes";
// ========================================
// --- SEND ------------------------------
// sign the queued swap from the reader's account.
//
// --- WHY THE READER'S OWN ACCOUNT IS THE ONE THAT SIGNS: a queued
// swap is an open offer, and the reader who presses SWAP NOW is
// trading with their own wallet. the swap was named for somebody, but
// the wallet that signs is the one that is open in the browser.
//
// --- WHY A MISSING ROUTE IS REFUSED BEFORE THE WALLET OPENS: there is
// nothing to sign without a route, and asking the reader to approve a
// popup that has nothing behind it is worse than saying no dex can
// serve the pair.
export async function shit_1170_feed_send_swap_fun(
  swap: SHIT_1170_SWAP_QUEUE,
  routes: ReadonlyArray<SHIT_1170_SWAP_ROUTE>,
  output_decimals: number | null,
): Promise<void> {
  const account_id = SHIT_1170_AUTH.get_account_id();
  if (account_id === null) return;
  const best = routes[0];
  if (best === undefined) return;
  await SHIT_1170_SWAP_SEND.send({
    route: best.raw,
    token_in: swap.tokenIn,
    token_out: swap.tokenOut,
    account_id,
    swap,
    output_decimals,
  });
}
// ========================================
// --- REFRESH ---------------------------
// read the feed again, so the card shows the new status and the hash.
//
// --- WHY IT IS AFTER THE SEND AND NOT INSIDE IT: the refresh is the
// feed's business, and the send is the swap's. a caller that wants the
// feed refreshed after the send asks for it, and a caller that does
// not does not pay for it.
export async function shit_1170_feed_swap_send_refresh_fun(): Promise<void> {
  await SHIT_1170_APP_PAGE_FEED_STORE.refresh();
}
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_SWAP_SEND = {
  send: shit_1170_feed_send_swap_fun,
  refresh: shit_1170_feed_swap_send_refresh_fun,
};
// ========================================
// copyright 2026 by sleet.near
