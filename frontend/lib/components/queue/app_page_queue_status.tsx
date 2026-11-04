// ========================================
// the queue page's status line: where the READER stands on this batch.
//
// --- WHY THE STATUS IS ABOUT THE READER: a batch can be sent by alice
// and not by bob. the status line is about the READER's account on it,
// because that is the only status that means something to them. the
// other accounts are the ACCOUNTS component, and their statuses are a
// tick and not a tick.
//
// --- WHY IT SAYS NOTHING WHEN THE READER IS NOT ON THE BATCH: there is
// no status to say — the ADD button is the whole message.
//
// mounts into <div id="SHIT_1170_COMPONENT_QUEUE_STATUS">.
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_QUEUE_STORE } from "../../ts/queue/app_page_queue_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { SHIT_1170_AUTH } from "../../ts/shared/auth_status";
import { tx_detail_href_fun } from "../../ts/shared/tx_link";
import { current_app_depth_fun } from "../../ts/shared/app_depth";
import {
  shit_1170_feed_reader_status_fun,
  type SHIT_1170_QUEUE_READER_STATUS,
} from "../../ts/feed/app_page_feed_actions";
import type { SHIT_1170_TX_QUEUE } from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the status word and its state class.
//
// --- WHY --- A SENT BUT UNKNOWN OUTCOME IS ITS OWN WORD: it went out
// and nobody knows how it went yet, which is neither a success nor a
// failure.
function status_word_fun(
  status: SHIT_1170_QUEUE_READER_STATUS,
): { label: string; class_name: string } | null {
  if (status === "waiting")
    return {
      label: "WAITING — YOU HAVE NOT SENT THIS YET",
      class_name: "is-waiting",
    };
  if (status === "sent")
    return {
      label: "SENT — THE OUTCOME IS NOT KNOWN YET",
      class_name: "is-sent",
    };
  if (status === "succeeded")
    return { label: "SENT — IT WORKED", class_name: "is-succeeded" };
  if (status === "failed")
    return { label: "SENT — IT FAILED", class_name: "is-failed" };
  return null;
}

// the reader's own hash on this batch, or null.
//
// --- WHY --- THE TRANSACTIONS ARE CHECKED FIRST: the account row on a
// transaction is where the hash of THAT transaction lives, and the
// queue's own account row is the union of them.
function reader_hash_fun(
  queue: SHIT_1170_TX_QUEUE,
  account_id: string | null,
): string | null {
  if (account_id === null) return null;
  for (const transaction of queue.transactions) {
    const row = transaction.accounts.find(
      (account) => account.accountId === account_id,
    );
    if (row !== undefined && row.txHash !== null) return row.txHash;
  }
  for (const account of queue.accounts) {
    if (account.accountId === account_id) return account.txHash;
  }
  return null;
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_QUEUE_STATUS_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_QUEUE_STORE);
  const account_id = SHIT_1170_AUTH.get_account_id();
  const queue = state.queue;
  if (queue === null) return null;
  const status = shit_1170_feed_reader_status_fun(queue, account_id);
  const word = status_word_fun(status);
  // --- WHY --- THE READER NOT BEING ON THE BATCH SAYS NOTHING: the ADD
  // button is the message, and a line saying "YOU ARE NOT ON THIS"
  // beside it would say it twice.
  if (word === null) return null;
  const hash = reader_hash_fun(queue, account_id);
  const depth = current_app_depth_fun();
  return (
    <p class={`queue-status ${word.class_name}`}>
      <span class="queue-status-dot" aria-hidden="true" />
      {word.label}
      {hash !== null && (
        <a class="queue-status-link" href={tx_detail_href_fun(hash, depth)}>
          VIEW TX
        </a>
      )}
    </p>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_QUEUE_STATUS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_QUEUE_STATUS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
