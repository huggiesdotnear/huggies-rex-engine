// ========================================
// the feed page's SWAP ACTIONS: adding your account to a queued swap,
// taking it off, and where you stand on one.
//
// these are the reader's own writes, so they carry the reader's api key
// and nothing else — the backend knows the account from the key.
//
// --- WHY --- THEY ARE THEIR OWN FILE AND NOT IN THE QUEUE'S ACTIONS: a
// queued swap is a different resource with different routes, and the
// two must not be confused with each other.
import {
  api_shit_1170_swap_queue_accounts_delete,
  api_shit_1170_swap_queue_accounts_post,
  type SHIT_1170_SWAP_QUEUE,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_BASE_URL } from "../shared/base_url";
import { api_key_options_fun } from "../shared/api_key_token";
import { SHIT_1170_AUTH } from "../shared/auth_status";
import { SHIT_1170_TOAST_STORE } from "../shared/toast_store";
import { SHIT_1170_APP_PAGE_FEED_STORE } from "./app_page_feed_store";
import type { SHIT_1170_QUEUE_READER_STATUS } from "./app_page_feed_actions";
// ========================================
// --- STATUS ----------------------------
// where the READER stands on one queued swap.
//
// --- WHY --- THE STATUS IS ABOUT THE READER AND NOT ABOUT THE SWAP: a
// swap can be sent by alice and not by bob. the status line is about
// the READER's account on it, because that is the only status that
// means something to them.
//
// --- WHY --- IT REUSES THE QUEUE'S STATUS WORDS: the reader sees
// WAITING, SENT, SENT ✓ and FAILED in both places, and one set of words
// for one set of states is easier to read than two.
export function shit_1170_feed_reader_swap_status_fun(
  swap: SHIT_1170_SWAP_QUEUE,
  account_id: string | null,
): SHIT_1170_QUEUE_READER_STATUS {
  if (account_id === null) return "not_on_queue";
  const row = swap.accounts.find((account) => account.accountId === account_id);
  if (row === undefined) return "not_on_queue";
  if (row.status === "pending") return "waiting";
  if (row.status === "sent") return "sent";
  if (row.status === "succeeded") return "succeeded";
  return "failed";
}

// ========================================
// --- ADD -------------------------------
// add the reader's account to a queued swap.
//
// --- WHY THE ACCOUNT IS IN THE BODY: the route reads the account from
// the body and the key from the header, and it answers a 403 when the
// two do not match. so the body says which account and the key says who
// is asking.
export async function shit_1170_feed_add_swap_fun(
  swap: SHIT_1170_SWAP_QUEUE,
): Promise<boolean> {
  const account_id = SHIT_1170_AUTH.get_account_id();
  if (account_id === null) return false;
  try {
    const options = await api_key_options_fun(true, account_id);
    await api_shit_1170_swap_queue_accounts_post(
      SHIT_1170_BASE_URL,
      swap.swapId,
      { accountId: account_id },
      options,
    );
    await SHIT_1170_APP_PAGE_FEED_STORE.refresh();
    SHIT_1170_TOAST_STORE.show("success", "ADDED", null, null);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    SHIT_1170_TOAST_STORE.show("error", "COULD NOT ADD YOU", message, null);
    return false;
  }
}

// ========================================
// --- REMOVE ----------------------------
// take the reader's account off a queued swap.
export async function shit_1170_feed_remove_swap_fun(
  swap: SHIT_1170_SWAP_QUEUE,
): Promise<boolean> {
  const account_id = SHIT_1170_AUTH.get_account_id();
  if (account_id === null) return false;
  try {
    const options = await api_key_options_fun(true, account_id);
    await api_shit_1170_swap_queue_accounts_delete(
      SHIT_1170_BASE_URL,
      swap.swapId,
      account_id,
      options,
    );
    await SHIT_1170_APP_PAGE_FEED_STORE.refresh();
    SHIT_1170_TOAST_STORE.show("success", "REMOVED", null, null);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    SHIT_1170_TOAST_STORE.show("error", "COULD NOT REMOVE YOU", message, null);
    return false;
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
