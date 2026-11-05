// ========================================
// one post in the feed: the WHAT, the one call line, the WHO chips, the
// reader's status and the actions.
//
// the post is SMALL on purpose: it answers "is this worth my attention?"
// and the queue page answers "exactly what is this?".
//
// --- WHY THE POSTS ARE ONE LIST AND NOT TWO: the reader reads one
// feed. two lists would mean two scrolls, two "nothing here" messages
// and two orders to think about. one list, two kinds of card.
//
// --- WHY THE WHAT IS THE HEADLINE: it is the agent's own sentence
// about the batch, and it is the one thing about a batch that needs no
// explaining.
//
// --- WHY THE FIRST CALL IS SHOWN AND NOT THE METHOD NAME ALONE: a
// queued `ft_transfer` carries a token amount, and that is the most
// useful thing on the card.
//
// --- WHY THE WHO ARE CHIPS AND NOT A COUNT: a count says "2 accounts"
// and tells the reader nothing about whether they are one of them. a
// chip with their own id on it tells them at a glance.
//
// --- WHY THE ADD / REMOVE BUTTON IS ONE BUTTON: it says the opposite
// of what it will do. if your account is on the queue and has not sent
// it, the button says REMOVE. if it is not on the queue, it says ADD.
// if you have already sent it, there is nothing to add or remove, so
// the button is gone and the status takes its place.
//
// --- WHY ADD IS HIDDEN WHEN THE READER IS SIGNED OUT: a button that
// cannot work is noise.
import { render } from "preact";
import { useState as use_state } from "preact/hooks";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_FEED_STORE } from "../../ts/feed/app_page_feed_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { SHIT_1170_AUTH } from "../../ts/shared/auth_status";
import { SHIT_1170_API_KEY } from "../../ts/shared/api_key";
import { queue_detail_href_fun } from "../../ts/shared/tx_link";
import { current_app_depth_fun } from "../../ts/shared/app_depth";
import {
  shit_1170_feed_add_fun,
  shit_1170_feed_remove_fun,
  shit_1170_feed_reader_status_fun,
  shit_1170_feed_send_fun,
} from "../../ts/feed/app_page_feed_actions";
import { SHIT_1170_COMPONENT_APP_PAGE_FEED_TRANSACTIONS_FUN } from "./app_page_feed_transactions";
import { SHIT_1170_COMPONENT_APP_PAGE_FEED_SWAP_POST_FUN } from "./app_page_feed_swap_post";
import { tx_detail_href_fun } from "../../ts/shared/tx_link";
import type { SHIT_1170_TX_QUEUE } from "@huggies/shit-1170-rex-engine-middleman";
import type { SHIT_1170_QUEUE_READER_STATUS } from "../../ts/feed/app_page_feed_actions";
import type { SHIT_1170_FEED_POST } from "../../ts/feed/app_page_feed_posts";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the headline of the post: the agent's WHAT, or the first call's
// method when there is no WHAT.
//
// --- WHY --- THE METHOD IS THE FALLBACK AND NOT NOTHING: a batch with
// no WHAT still has a method, and a headline that says "ft_swap" tells
// the reader more than an empty line.
function headline_fun(queue: SHIT_1170_TX_QUEUE): string {
  if (queue.what !== null && queue.what.trim().length > 0) {
    return queue.what.trim();
  }
  const first = queue.transactions[0];
  if (first === undefined) return "A QUEUED BATCH";
  return first.method;
}

// the status word and its state class.
//
// --- WHY --- A SENT BUT UNKNOWN OUTCOME IS ITS OWN WORD: it went out
// and nobody knows how it went yet, which is neither a success nor a
// failure.
function status_word_fun(
  status: SHIT_1170_QUEUE_READER_STATUS,
): { label: string; class_name: string } | null {
  if (status === "waiting")
    return { label: "WAITING", class_name: "is-waiting" };
  if (status === "sent") return { label: "SENT", class_name: "is-sent" };
  if (status === "succeeded")
    return { label: "SENT ✓", class_name: "is-succeeded" };
  if (status === "failed") return { label: "FAILED", class_name: "is-failed" };
  return null;
}

// the reader's own hash on this post, or null.
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
// --- POST STATUS ------------------------
// the reader's status on one post.
//
// --- WHY THE STATUS IS ABOUT THE READER: a post can be sent by alice
// and not by bob. the status line is about the READER's account on that
// post, because that is the only status that means something to them.
// the other accounts are the chips, and their statuses are a tick and
// not a tick.
//
// --- WHY IT SAYS NOTHING WHEN THE READER IS NOT ON THE POST: there is
// no status to say — the ADD button is the whole message.
function post_status_fun(
  queue: SHIT_1170_TX_QUEUE,
  account_id: string | null,
  status: SHIT_1170_QUEUE_READER_STATUS,
): preact.JSX.Element | null {
  const word = status_word_fun(status);
  if (word === null) return null;
  const hash = reader_hash_fun(queue, account_id);
  const depth = current_app_depth_fun();
  return (
    <span class={`feed-status ${word.class_name}`}>
      <span class="feed-status-dot" aria-hidden="true" />
      {word.label}
      {hash !== null && (
        <a class="feed-status-link" href={tx_detail_href_fun(hash, depth)}>
          VIEW TX
        </a>
      )}
    </span>
  );
}

// ========================================
// --- POST ------------------------------
// one post.
//
// --- WHY --- THE POST IS ITS OWN COMPONENT: the hooks belong to a
// component, and a post is one card with its own state — whether it is
// busy — so each post gets its own.
function Post(props: { queue: SHIT_1170_TX_QUEUE }) {
  const queue = props.queue;
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_FEED_STORE);
  const account_id = SHIT_1170_AUTH.get_account_id();
  const status = shit_1170_feed_reader_status_fun(queue, account_id);
  const [busy, set_busy] = use_state(false);
  const depth = current_app_depth_fun();

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
      await shit_1170_feed_send_fun(queue);
    } finally {
      set_busy(false);
    }
  };

  const add_fun = async () => {
    set_busy(true);
    try {
      await shit_1170_feed_add_fun(queue);
    } finally {
      set_busy(false);
    }
  };

  const remove_fun = async () => {
    set_busy(true);
    try {
      await shit_1170_feed_remove_fun(queue);
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
    <article class="feed-post">
      <h2 class="feed-post-what">{headline_fun(queue)}</h2>
      <SHIT_1170_COMPONENT_APP_PAGE_FEED_TRANSACTIONS_FUN
        queue={queue}
        tokens={state.tokens}
      />
      <div class="feed-post-meta">
        <div class="feed-post-who">
          {queue.accounts.map((account) => (
            <span
              key={account.accountId}
              class={
                account.status === "pending" ? "feed-chip" : "feed-chip is-sent"
              }
              title={account.accountId}
            >
              {account.accountId}
              {account.status !== "pending" && (
                <span class="feed-chip-tick" aria-hidden="true">
                  ✓
                </span>
              )}
            </span>
          ))}
        </div>
        <PostStatus queue={queue} account_id={account_id} status={status} />
      </div>
      <div class="feed-post-actions">
        <button
          type="button"
          class="feed-post-send"
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
            class="feed-post-queue"
            disabled={busy}
            onClick={() => {
              void (on_queue ? remove_fun() : add_fun());
            }}
          >
            {on_queue ? "REMOVE" : "ADD"}
          </button>
        )}
        <a
          class="feed-post-detail"
          href={queue_detail_href_fun(queue.queueId, depth)}
        >
          DETAIL
        </a>
      </div>
    </article>
  );
}

// ========================================
// --- POST STATUS ------------------------
// the reader's status on one post.
//
// --- WHY IT IS A COMPONENT AND NOT A CALL: it draws its own markup,
// and a plain call would be fine — but the component keeps the props
// named and the drawing in one place.
function PostStatus(props: {
  queue: SHIT_1170_TX_QUEUE;
  account_id: string | null;
  status: SHIT_1170_QUEUE_READER_STATUS;
}) {
  return post_status_fun(props.queue, props.account_id, props.status);
}

// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_APP_PAGE_FEED_POST_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_FEED_STORE);
  if (state.error !== null) return null;
  const posts = SHIT_1170_APP_PAGE_FEED_STORE.get_posts();
  if (posts.length === 0) {
    if (state.loading) return <p class="feed-empty">LOADING THE FEED…</p>;
    return <p class="feed-empty">NO QUEUED BATCHES</p>;
  }
  return (
    <div class="feed-posts">
      {/* --- WHY --- THE TWO KINDS OF CARD ARE DRAWN FROM ONE LIST: the
          reader reads one feed, and the order of the cards is the
          feed's business. a swap is not a batch, so it gets its own
          card — but it sits in the same list, in the same order. */}
      {posts.map((post: SHIT_1170_FEED_POST) =>
        post.kind === "queue" ? (
          <Post key={post.queue.queueId} queue={post.queue} />
        ) : (
          <SHIT_1170_COMPONENT_APP_PAGE_FEED_SWAP_POST_FUN
            key={post.swap.swapId}
            swap={post.swap}
            quote={post.quote}
            routes={post.routes}
          />
        ),
      )}
    </div>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_APP_PAGE_FEED_POST;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_APP_PAGE_FEED_POST_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
