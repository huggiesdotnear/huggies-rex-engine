// ========================================
// the queue page's WHO: every account on the batch, its status and its
// hash.
//
// --- WHY THE HASH LINKS TO THE TRANSACTION PAGE: that is the whole
// point of keeping the hash — the reader can go and see what actually
// happened on the chain.
//
// --- WHY THE LINK IS BUILT WITH THE PAGE'S DEPTH: the page can sit at
// any depth under /app/, and a link built for the wrong depth lands on
// a page that does not exist.
//
// mounts into <div id="SHIT_1170_COMPONENT_QUEUE_ACCOUNTS">.
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_QUEUE_STORE } from "../../ts/queue/app_page_queue_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { SHIT_1170_AUTH } from "../../ts/shared/auth_status";
import { tx_detail_href_fun } from "../../ts/shared/tx_link";
import { current_app_depth_fun } from "../../ts/shared/app_depth";
import type { SHIT_1170_TX_QUEUE_ACCOUNT } from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the status word and its state class.
//
// --- WHY --- PENDING IS "WAITING": a pending account row is one that
// has not sent it yet, and "waiting" says that in one word.
//
// --- WHY --- "SENT" IS ITS OWN WORD: it went out and nobody knows how
// it went yet, which is neither a success nor a failure.
function status_word_fun(status: string): {
  label: string;
  class_name: string;
} {
  if (status === "pending")
    return { label: "WAITING", class_name: "is-waiting" };
  if (status === "sent") return { label: "SENT", class_name: "is-sent" };
  if (status === "succeeded")
    return { label: "SENT ✓", class_name: "is-succeeded" };
  return { label: "FAILED ✗", class_name: "is-failed" };
}

// the account's link to its own page.
function account_href_fun(account_id: string): string {
  const depth = current_app_depth_fun();
  return `${"../".repeat(depth)}account.html?id=${encodeURIComponent(account_id)}`;
}

// ========================================
// --- ROW -------------------------------
// one account: its id, its status and its hash.
function account_fun(
  account: SHIT_1170_TX_QUEUE_ACCOUNT,
  is_reader: boolean,
): preact.JSX.Element {
  const word = status_word_fun(account.status);
  const depth = current_app_depth_fun();
  return (
    <div class={is_reader ? "queue-account is-reader" : "queue-account"}>
      <a class="queue-account-id" href={account_href_fun(account.accountId)}>
        {account.accountId}
      </a>
      <span class={`queue-account-status ${word.class_name}`}>
        {word.label}
      </span>
      {account.txHash !== null ? (
        <a
          class="queue-account-hash"
          href={tx_detail_href_fun(account.txHash, depth)}
        >
          {account.txHash.slice(0, 12)}…
        </a>
      ) : (
        <span class="queue-account-hash is-empty">—</span>
      )}
    </div>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_QUEUE_ACCOUNTS_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_QUEUE_STORE);
  const queue = state.queue;
  if (queue === null) return null;
  const accounts = queue.accounts;
  if (accounts.length === 0) return null;
  const reader_id = SHIT_1170_AUTH.get_account_id();
  return (
    <section class="queue-accounts">
      <h2>ACCOUNTS ({accounts.length})</h2>
      <div class="queue-accounts-list">
        {accounts.map((account) => (
          <div key={account.accountId}>
            {account_fun(account, account.accountId === reader_id)}
          </div>
        ))}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_QUEUE_ACCOUNTS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_QUEUE_ACCOUNTS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
