// ========================================
// the feed page's ACTIONS: adding your account to a batch, taking it
// off, and sending it.
//
// these are the reader's own writes, so they carry the reader's api key
// and nothing else — the backend knows the account from the key.
import {
  api_shit_1170_tx_queue_accounts_delete,
  api_shit_1170_tx_queue_accounts_post,
  type SHIT_1170_TX_QUEUE,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_BASE_URL } from "../shared/base_url";
import { api_key_options_fun } from "../shared/api_key_token";
import { SHIT_1170_AUTH } from "../shared/auth_status";
import { SHIT_1170_TOAST_STORE } from "../shared/toast_store";
import { shit_1170_queue_send_fun } from "./app_page_feed_send";
import { SHIT_1170_APP_PAGE_FEED_STORE } from "./app_page_feed_store";
import type { SHIT_1170_QUEUE_SEND_RESULT } from "./app_page_feed_send";
// ========================================
// ========================================
// --- TYPES ------------------------------
// where the reader stands on one batch.
//
// --- WHY --- IT IS READ FROM THE BATCH'S OWN ACCOUNT ROWS: the truth
// about one account on one batch lives on the account row, and there is
// one row per account. so the reader's row IS their status.
export type SHIT_1170_QUEUE_READER_STATUS =
  "not_on_queue" | "waiting" | "sent" | "succeeded" | "failed";

// ========================================
// --- STATUS ----------------------------
// where the READER stands on one batch.
//
// --- WHY --- THE STATUS IS ABOUT THE READER AND NOT ABOUT THE BATCH: a
// batch can be sent by alice and not by bob. the status line is about
// the READER's account on it, because that is the only status that
// means something to them. the other accounts are the chips, and their
// statuses are a tick and not a tick.
export function shit_1170_feed_reader_status_fun(
  queue: SHIT_1170_TX_QUEUE,
  account_id: string | null,
): SHIT_1170_QUEUE_READER_STATUS {
  if (account_id === null) return "not_on_queue";
  const row = queue.accounts.find(
    (account) => account.accountId === account_id,
  );
  if (row === undefined) return "not_on_queue";
  if (row.status === "pending") return "waiting";
  if (row.status === "sent") return "sent";
  if (row.status === "succeeded") return "succeeded";
  return "failed";
}

// ========================================
// --- ADD -------------------------------
// add the reader's account to a batch.
//
// --- WHY THE ACCOUNT IS IN THE BODY: the route reads the account from
// the body and the key from the header, and it answers a 403 when the
// two do not match. so the body says which account and the key says who
// is asking.
export async function shit_1170_feed_add_fun(
  queue: SHIT_1170_TX_QUEUE,
): Promise<boolean> {
  const account_id = SHIT_1170_AUTH.get_account_id();
  if (account_id === null) return false;
  try {
    const options = await api_key_options_fun(true, account_id);
    await api_shit_1170_tx_queue_accounts_post(
      SHIT_1170_BASE_URL,
      queue.queueId,
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
// take the reader's account off a batch.
export async function shit_1170_feed_remove_fun(
  queue: SHIT_1170_TX_QUEUE,
): Promise<boolean> {
  const account_id = SHIT_1170_AUTH.get_account_id();
  if (account_id === null) return false;
  try {
    const options = await api_key_options_fun(true, account_id);
    await api_shit_1170_tx_queue_accounts_delete(
      SHIT_1170_BASE_URL,
      queue.queueId,
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
// --- SEND ------------------------------
// send the batch from the reader's account.
//
// --- WHY THE API KEY IS CHECKED BEFORE THE WALLOAD: the send is
// reported to the backend with the reader's key, and a reader with no
// key has nothing to report it with. so the button is disabled and the
// flow stops here.
export async function shit_1170_feed_send_fun(
  queue: SHIT_1170_TX_QUEUE,
): Promise<SHIT_1170_QUEUE_SEND_RESULT | null> {
  const account_id = SHIT_1170_AUTH.get_account_id();
  if (account_id === null) return null;
  const result = await shit_1170_queue_send_fun(queue, account_id);
  await SHIT_1170_APP_PAGE_FEED_STORE.refresh();
  return result;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
