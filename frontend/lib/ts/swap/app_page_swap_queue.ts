// ========================================
// the swap page's QUEUED SWAP: the one the url points at.
//
// the feed links to the swap page with `?swap=<id>`, so the page opens
// on the exact trade that was queued — the token in, the amount in and
// the token out — and when the reader executes it the result is
// reported back to THAT queued swap, so the feed can show it went out.
//
// --- WHY THE REPORT IS NOT HERE: the send is the SHARED one — the feed's
// SWAP NOW button and this page's SWAP button both call it, and it
// reports the result against the queued swap. so the page only needs to
// HOLD the queued swap, and the send needs to be handed it.
//
// --- WHY THE QUEUED SWAP IS HELD AND NOT MERGED INTO THE PAGE'S OWN
// STATE: the page's state is the reader's trade — the tokens, the
// amount, the routes. the queued swap is a RECORD of something somebody
// else put up. the reader can change the trade, and the record stays
// what it was. so they are two things, and the page holds both.
import {
  api_shit_1170_swap_queue_one_get,
  type SHIT_1170_SWAP_QUEUE,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_BASE_URL } from "../shared/base_url";
import { api_key_options_fun } from "../shared/api_key_token";
// ========================================
// --- GET -------------------------------
// the queued swap the url points at, or null.
//
// --- WHY --- NULL AND NOT AN ERROR: a swap id that is not there is not
// a broken page. the page opens on a plain swap and the reader does
// what they came to do.
export async function shit_1170_swap_queue_get_fun(
  swap_id: string,
): Promise<SHIT_1170_SWAP_QUEUE | null> {
  const trimmed = swap_id.trim();
  if (trimmed.length === 0) return null;
  try {
    const options = await api_key_options_fun(false);
    return await api_shit_1170_swap_queue_one_get(
      SHIT_1170_BASE_URL,
      trimmed,
      options,
    );
  } catch (err) {
    console.warn(
      "[app_page_swap_queue] the queued swap could not be read",
      err,
    );
    return null;
  }
}
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_SWAP_QUEUE = {
  get: shit_1170_swap_queue_get_fun,
};
// ========================================
// copyright 2026 by sleet.near
