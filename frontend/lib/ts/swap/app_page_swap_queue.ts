// ========================================
// the swap page's QUEUED SWAP: the one the url points at, and the report
// of what happened when the reader executed it.
//
// the feed links to the swap page with `?swap=<id>`, so the page opens
// on the exact trade that was queued — the token in, the amount in and
// the token out — and when the reader executes it the result is
// reported back to THAT queued swap, so the feed can show it went out.
//
// --- WHY THE REPORT IS SENT FROM HERE AND NOT FROM THE FEED: the feed
// never signs a queued swap. the swap page does, because the swap page
// is the one that works out the route. so the swap page is the one that
// knows the hash, the outcome and the amount out.
//
// --- WHY THE QUEUED SWAP IS HELD AND NOT MERGED INTO THE PAGE'S OWN
// STATE: the page's state is the reader's trade — the tokens, the
// amount, the routes. the queued swap is a RECORD of something somebody
// else put up. the reader can change the trade, and the record stays
// what it was. so they are two things, and the page holds both.
import {
  api_shit_1170_swap_queue_one_get,
  api_shit_1170_swap_queue_sent_post,
  type SHIT_1170_SWAP_QUEUE,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_BASE_URL } from "../shared/base_url";
import { api_key_options_fun } from "../shared/api_key_token";
// ========================================
// --- TYPES ------------------------------
// what happened when the reader executed a queued swap.
export interface SHIT_1170_SWAP_SENT_REPORT {
  // true when the report reached the backend.
  reported: boolean;
  // the message for the reader, when it did not.
  error: string | null;
}
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
// --- REPORT ----------------------------
// report that the queued swap went out.
//
// --- WHY --- THE ACCOUNT IS NOT SENT: the api key IS the account. the
// backend reads the account from the key and writes the hash on that
// account's own row.
//
// --- WHY --- THE AMOUNT OUT IS SENT WHEN IT IS KNOWN: the amount that
// came out belongs to THAT send. two accounts executing the same queued
// swap get two different amounts out, because the pools moved between
// the two sends, so it is recorded on the account row and not on the
// swap.
//
// --- WHY --- A FAILED REPORT IS NOT FATAL: the swap DID go out. the
// report is the backend's record of it, and a backend that cannot be
// reached must not turn a working swap into a failure in the reader's
// eyes. the error is handed back so the page can say so.
export async function shit_1170_swap_queue_report_fun(
  swap_id: string,
  tx_hash: string,
  status: "succeeded" | "failed" | "sent",
  amount_out: string | null,
): Promise<SHIT_1170_SWAP_SENT_REPORT> {
  const trimmed = swap_id.trim();
  if (trimmed.length === 0) {
    return { reported: false, error: "there is no queued swap to report" };
  }
  try {
    const options = await api_key_options_fun(true);
    await api_shit_1170_swap_queue_sent_post(
      SHIT_1170_BASE_URL,
      trimmed,
      {
        txHash: tx_hash,
        status,
        amountOut: amount_out ?? undefined,
      },
      options,
    );
    return { reported: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[app_page_swap_queue] the send could not be reported", err);
    return { reported: false, error: message };
  }
}
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_SWAP_QUEUE = {
  get: shit_1170_swap_queue_get_fun,
  report: shit_1170_swap_queue_report_fun,
};
// ========================================
// copyright 2026 by sleet.near
