// ========================================
// the queue page's actions: ADD / REMOVE and SEND.
//
// the same three buttons the feed's posts carry, and the same rules:
// the ADD / REMOVE is ONE button that says the opposite of what it will
// do, and the SEND is off without an api key.
//
// mounts into <div id="SHIT_1170_COMPONENT_QUEUE_ACTIONS">.
import { render } from "preact";
import { useState as use_state } from "preact/hooks";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_QUEUE_STORE } from "../../ts/queue/app_page_queue_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { SHIT_1170_AUTH } from "../../ts/shared/auth_status";
import { SHIT_1170_API_KEY } from "../../ts/shared/api_key";
import { shit_1170_feed_reader_status_fun } from "../../ts/feed/app_page_feed_actions";
import {
  shit_1170_queue_add_fun,
  shit_1170_queue_remove_fun,
  shit_1170_queue_send_fun,
} from "../../ts/queue/app_page_queue_send";
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_QUEUE_ACTIONS_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_QUEUE_STORE);
  const account_id = SHIT_1170_AUTH.get_account_id();
  const [busy, set_busy] = use_state(false);
  const queue = state.queue;
  if (queue === null) return null;

  const status = shit_1170_feed_reader_status_fun(queue, account_id);
  // --- WHY --- THE SEND BUTTON IS OFF WITHOUT AN API KEY: the send is
  // reported to the backend with the reader's key, and a reader with no
  // key has nothing to report it with.
  const has_api_key =
    account_id !== null && SHIT_1170_API_KEY.get_api_key(account_id) !== null;
  const can_send =
    account_id !== null &&
    has_api_key &&
    status === "waiting" &&
    !busy &&
    !state.loading;

  const send_fun = async () => {
    if (!can_send) return;
    set_busy(true);
    try {
      await shit_1170_queue_send_fun(queue);
    } finally {
      set_busy(false);
    }
  };

  const add_fun = async () => {
    set_busy(true);
    try {
      await shit_1170_queue_add_fun(queue);
    } finally {
      set_busy(false);
    }
  };

  const remove_fun = async () => {
    set_busy(true);
    try {
      await shit_1170_queue_remove_fun(queue);
    } finally {
      set_busy(false);
    }
  };

  // --- WHY --- THE BUTTON SAYS WHAT IT WILL DO: it is one button and
  // not two. two buttons side by side, one of which is always wrong, is
  // worse than one button that says what it will do.
  const on_queue = status !== "not_on_queue";
  const sent =
    status === "sent" || status === "succeeded" || status === "failed";

  return (
    <div class="queue-actions">
      <button
        type="button"
        class="queue-action-send"
        disabled={!can_send}
        onClick={() => {
          void send_fun();
        }}
        title={
          has_api_key
            ? "send these transactions from your account"
            : "you need an api key to report a send"
        }
      >
        {busy ? "WORKING…" : "SEND"}
      </button>
      {account_id !== null && !sent && (
        <button
          type="button"
          class="queue-action-queue"
          disabled={busy}
          onClick={() => {
            void (on_queue ? remove_fun() : add_fun());
          }}
        >
          {on_queue ? "REMOVE" : "ADD"}
        </button>
      )}
      {!has_api_key && account_id !== null && (
        <p class="queue-action-hint">YOU NEED AN API KEY TO SEND THIS</p>
      )}
    </div>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_QUEUE_ACTIONS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_QUEUE_ACTIONS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
