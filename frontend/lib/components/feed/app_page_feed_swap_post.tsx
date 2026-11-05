// ========================================
// one queued SWAP in the feed: the token in, the amount in, the token
// out, the LIVE amount out, and the link to the swap page.
//
// a queued swap is NOT a queued batch of transactions. it has no calls
// yet — the agent named a token in, an amount in and a token out, and
// the route is worked out when the reader executes it. so the card does
// not show a contract and a method. it shows a TRADE: what goes in, and
// what comes out.
//
// --- WHY THE LIVE AMOUNT OUT IS ON THE CARD: it is the whole point of
// a queued swap. "100 USDC for NEAR" is a question; the amount out is
// the answer, and the answer moves every block. so the card shows the
// router's CURRENT best route's amount out, and the reader sees what
// the trade is worth right now.
//
// --- WHY THE STORED QUOTE IS THE FALLBACK: the router can be down, and
// a card with no number in it is worse than a card with a number from a
// minute ago. the backend kept the quote that was taken when the swap
// was queued, so there is always something to show.
//
// --- WHY SWAP NOW IS A BUTTON AND NOT A LINK: it is the TRADE. it does
// what the swap page's SWAP button does — it works out the route, hands
// it to the wallet and records what came of it against the queued
// swap. DETAILS is the record, and that IS a link to the swap page.
//
// --- WHY THE ROUTE IS WORKED OUT AT SEND TIME AND NOT ON PAGE LOAD:
// the pools move every block, and a route that is minutes old can be
// stale. so the send asks the router again, with the reader's account,
// and uses the route that answer gives.
//
// --- WHY THERE ARE TWO ACTIONS AND NOT ONE: SWAP NOW is the trade, and
// DETAILS is the record. one is a button that signs, the other is a
// link the reader can open, bookmark or send somebody without meaning
// to trade anything.
//
// --- WHY THE ARROW IS AN ICON AND NOT A CHARACTER: the app's icons
// come from lucide, and an arrow drawn as a character sits on the
// text's baseline while the token amounts beside it sit on their own.
// the icon is in a flex box, so it centres on the amounts.
//
// --- WHY THE WHO ARE CHIPS AND NOT A COUNT: the same reason the queued
// batch's card uses them. a count says "2 accounts" and tells the
// reader nothing about whether they are one of them.
//
// --- WHY THE READER'S STATUS IS SHOWN: a reader who has already
// executed a queued swap needs to see that, and the status is the only
// thing that says it.
//
// --- WHY IT DOES NOT SELF-MOUNT: the card is drawn INSIDE the feed's
// post list, once per queued swap. a mount element would be the same id
// on every card, so the component takes the swap as a prop and the
// feed's own css file carries the rules.
import { useState as use_state } from "preact/hooks";
import { ArrowRight } from "lucide-preact";
import { SHIT_1170_APP_PAGE_FEED_STORE } from "../../ts/feed/app_page_feed_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { SHIT_1170_AUTH } from "../../ts/shared/auth_status";
import { swap_quote_href_fun } from "../../ts/shared/swap_link";
import { current_app_depth_fun } from "../../ts/shared/app_depth";
import { tx_detail_href_fun } from "../../ts/shared/tx_link";
import {
  shit_1170_transfer_amount_fun,
  shit_1170_transfer_icon_fun,
} from "../shared/transfer_amount";
import {
  shit_1170_feed_add_swap_fun,
  shit_1170_feed_reader_swap_status_fun,
  shit_1170_feed_remove_swap_fun,
} from "../../ts/feed/app_page_feed_swap_actions";
import {
  shit_1170_feed_send_swap_fun,
  shit_1170_feed_swap_send_refresh_fun,
} from "../../ts/feed/app_page_feed_swap_send";
import { SHIT_1170_API_KEY } from "../../ts/shared/api_key";
import type { SHIT_1170_SWAP_QUEUE } from "@huggies/shit-1170-rex-engine-middleman";
import type { SHIT_1170_SWAP_QUOTE } from "../../ts/shared/swap_quote";
import type { SHIT_1170_QUEUE_READER_STATUS } from "../../ts/feed/app_page_feed_actions";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the headline of the card: the agent's WHAT, or the trade itself.
//
// --- WHY --- THE WHAT IS THE HEADLINE AND NOT THE TRADE: the agent's
// own sentence about the swap is the one thing about it that needs no
// explaining. the trade is the line under it.
//
// --- WHY --- THE TRADE IS THE FALLBACK AND NOT NOTHING: a swap with no
// WHAT still has a token in and a token out, and a headline that says
// "100 USDC for NEAR" tells the reader more than an empty line.
function headline_fun(swap: SHIT_1170_SWAP_QUEUE): string {
  if (swap.what !== null && swap.what.trim().length > 0) {
    return swap.what.trim();
  }
  return `${swap.tokenIn} → ${swap.tokenOut}`;
}

// the status word and its state class.
//
// --- WHY --- THE WORDS ARE THE SAME AS THE QUEUED BATCH'S: the reader
// sees WAITING, SENT, SENT ✓ and FAILED in both places, and one set of
// words for one set of states is easier to read than two.
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

// the reader's own hash on this swap, or null.
//
// --- WHY --- THE ACCOUNT ROWS ARE THE PLACE: the hash of a swap the
// reader sent lives on their own account row.
function reader_hash_fun(
  swap: SHIT_1170_SWAP_QUEUE,
  account_id: string | null,
): string | null {
  if (account_id === null) return null;
  const row = swap.accounts.find((account) => account.accountId === account_id);
  if (row === undefined) return null;
  return row.txHash;
}

// the amount out the card shows: the live quote, or the stored one.
//
// --- WHY --- THE LIVE QUOTE WINS: it is the number a reader would get
// now, and the pools move every block.
//
// --- WHY --- THE STORED QUOTE IS THE FALLBACK: the router can be down,
// and a card with no number in it tells the reader nothing.
function amount_out_fun(
  swap: SHIT_1170_SWAP_QUEUE,
  quote: SHIT_1170_SWAP_QUOTE | null,
): string | null {
  if (quote !== null && quote.amount_out !== null) return quote.amount_out;
  return swap.amountOut;
}

// ========================================
// --- SWAP POST -------------------------
// one queued swap.
export function SHIT_1170_COMPONENT_APP_PAGE_FEED_SWAP_POST_FUN(props: {
  swap: SHIT_1170_SWAP_QUEUE;
  quote: SHIT_1170_SWAP_QUOTE | null;
}) {
  const swap = props.swap;
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_FEED_STORE);
  const account_id = SHIT_1170_AUTH.get_account_id();
  const status = shit_1170_feed_reader_swap_status_fun(swap, account_id);
  const [busy, set_busy] = use_state(false);
  const depth = current_app_depth_fun();

  const token_in = state.swap_tokens.get(swap.tokenIn) ?? null;
  const token_out = state.swap_tokens.get(swap.tokenOut) ?? null;
  const amount_out = amount_out_fun(swap, props.quote);

  const add_fun = async () => {
    set_busy(true);
    try {
      await shit_1170_feed_add_swap_fun(swap);
    } finally {
      set_busy(false);
    }
  };

  const remove_fun = async () => {
    set_busy(true);
    try {
      await shit_1170_feed_remove_swap_fun(swap);
    } finally {
      set_busy(false);
    }
  };

  // --- WHY --- THE SWAP BUTTON NEEDS AN API KEY: the send is reported
  // to the backend with the reader's key, and a reader with no key has
  // nothing to report it with. the swap itself would still go out, but
  // the feed would go on saying WAITING — so the button is off without
  // the key, the same rule the queued batch's SEND follows.
  const has_api_key =
    account_id !== null && SHIT_1170_API_KEY.get_api_key(account_id) !== null;
  const can_swap_now =
    account_id !== null && has_api_key && !busy && !state.loading;

  const swap_now_fun = async () => {
    if (!can_swap_now) return;
    set_busy(true);
    try {
      await shit_1170_feed_send_swap_fun(swap);
    } finally {
      // --- WHY --- THE FEED IS READ AGAIN EVEN WHEN THE SEND FAILED: the
      // send may have gone out even when the app could not read the
      // outcome, and the card's status is the backend's record. so the
      // feed is asked again either way, and the card says what the
      // backend says.
      await shit_1170_feed_swap_send_refresh_fun();
      set_busy(false);
    }
  };

  // --- WHY --- THE ADD / REMOVE BUTTON IS ONE BUTTON: it says the
  // opposite of what it will do. the same rule the queued batch's card
  // follows.
  const on_queue = status !== "not_on_queue";
  const sent =
    status === "sent" || status === "succeeded" || status === "failed";
  const word = status_word_fun(status);
  const hash = reader_hash_fun(swap, account_id);

  return (
    <article class="feed-post is-swap">
      <h2 class="feed-post-what">{headline_fun(swap)}</h2>
      {/* --- WHY --- THE TRADE IS ITS OWN LINE: the token in and the
          token out are the swap, and the amount out is the answer to
          them. a card that showed only one token would hide half of
          what the reader is being offered. */}
      <div class="feed-swap">
        <div class="feed-swap-side">
          {shit_1170_transfer_icon_fun(token_in)}
          {shit_1170_transfer_amount_fun({
            amount: swap.amountIn,
            token: token_in,
            contract_id: swap.tokenIn,
          })}
        </div>
        <span class="feed-swap-arrow" aria-hidden="true">
          <ArrowRight size={18} />
        </span>
        <div class="feed-swap-side">
          {shit_1170_transfer_icon_fun(token_out)}
          {amount_out !== null ? (
            shit_1170_transfer_amount_fun({
              amount: amount_out,
              token: token_out,
              contract_id: swap.tokenOut,
            })
          ) : (
            <span class="tx-token-amount">
              <span class="tx-token-value">—</span>
            </span>
          )}
        </div>
      </div>
      <div class="feed-post-meta">
        <div class="feed-post-who">
          {swap.accounts.map((account) => (
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
        {word !== null && (
          <span class={`feed-status ${word.class_name}`}>
            <span class="feed-status-dot" aria-hidden="true" />
            {word.label}
            {hash !== null && (
              <a
                class="feed-status-link"
                href={tx_detail_href_fun(hash, depth)}
              >
                VIEW TX
              </a>
            )}
          </span>
        )}
      </div>
      <div class="feed-post-actions">
        {/* --- WHY --- SWAP NOW IS A BUTTON: it is the trade, and the
            trade is a signing. it works out the route, hands it to the
            wallet and records what came of it against the queued swap.

            --- WHY --- DETAILS IS A LINK: it is the record, and the
            record is somewhere the reader can go — open it, bookmark
            it, send it somebody — without meaning to trade anything. */}
        <button
          type="button"
          class="feed-post-send is-swap"
          disabled={!can_swap_now}
          onClick={() => {
            void swap_now_fun();
          }}
          title={
            has_api_key
              ? "sign this swap from your account"
              : "you need an api key to report a send"
          }
        >
          {busy ? "WORKING…" : "SWAP NOW"}
        </button>
        <a
          class="feed-post-detail is-swap is-quiet"
          href={swap_quote_href_fun(
            swap.swapId,
            swap.tokenIn,
            swap.tokenOut,
            swap.amountIn,
            depth,
          )}
        >
          DETAILS
        </a>
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
      </div>
    </article>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
