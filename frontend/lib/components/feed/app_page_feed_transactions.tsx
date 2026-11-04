// ========================================
// the feed's ONE call line: the first transaction of the post, with its
// token amount when it has one.
//
// --- WHY THE POST SHOWS ONLY THE FIRST CALL: the post is SMALL. it
// answers "is this worth my attention?" and the queue page answers
// "exactly what is this?". a post that carried every transaction would
// be a wall of text, and a feed of walls is not a feed.
//
// --- WHY THE AMOUNT LEADS WHEN THERE IS ONE: a queued `ft_transfer` has
// a token amount and it is the most useful thing on the card. a queued
// `ft_swap` has an amount too, but no certain output, so the line shows
// what it knows — the amount in.
//
// --- WHY THE RENDERING IS THE SHARED ONE: the token's icon, the amount
// divided by its decimals, the symbol and the usd worth all come from
// the shared transfer amount component. a queued transfer and a
// finished transfer must read identically.
//
// --- WHY IT DOES NOT SELF-MOUNT: the call line is drawn INSIDE the
// post, once per post. a mount element would be the same id on every
// post, so the component takes the post as a prop and the post's own
// css file carries the rules — see
// SHIT_1170_COMPONENT_APP_PAGE_FEED_TRANSACTIONS.css.
import {
  shit_1170_transfer_amount_fun,
  shit_1170_transfer_icon_fun,
} from "../shared/transfer_amount";
import { shit_1170_queue_first_transfer_fun } from "../../ts/shared/queue_transfers";
import type { SHIT_1170_TRANSFER_TOKEN } from "../../ts/shared/transfer_tokens";
import type { SHIT_1170_TX_QUEUE } from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the args of one call, as a short readable line, or null when there are
// none.
//
// --- WHY --- THE ARGS ARE SUMMARISED AND NOT DUMPED: a call's args can
// be a dozen keys, and the post is small. the keys that carry the
// meaning are the ones that are money and the ones that are people —
// the amount, the receiver, the token, the sender. those are shown.
//
// --- WHY --- THE ORDER IS FIXED AND NOT THE OBJECT'S OWN: the order the
// agent wrote the args in is not meaningful, and a post whose lines
// changed shape between loads would be unreadable.
//
// --- WHY --- A LONG VALUE IS CUT: a memo or a blob of json can be very
// long, and the queue page carries it whole.
function args_summary_fun(args: Record<string, unknown>): string | null {
  const keys = ["amount", "receiver_id", "token_in", "token_out", "sender_id"];
  const parts: string[] = [];
  for (const key of keys) {
    const value = args[key];
    if (value === undefined || value === null) continue;
    if (typeof value === "object") continue;
    const text = String(value);
    if (text.length === 0) continue;
    parts.push(`${key}=${text.length > 24 ? `${text.slice(0, 24)}…` : text}`);
  }
  if (parts.length === 0) return null;
  return parts.join("  ");
}
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_APP_PAGE_FEED_TRANSACTIONS_FUN(props: {
  queue: SHIT_1170_TX_QUEUE;
  // the token metadata for the transfers the batches name.
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
}) {
  const first = props.queue.transactions[0];
  // a batch with no calls has nothing to show here.
  if (first === undefined) return null;
  const transfer = shit_1170_queue_first_transfer_fun(props.queue);

  return (
    <div class="feed-call">
      {transfer === null ? (
        // --- WHY --- AN UNRECOGNISED METHOD SHOWS THE CALL AND NOT A
        // TRANSFER: the args are still in the queue page, so nothing is
        // hidden — the reader just does not get a pretty amount for it.
        <span class="feed-call-contract">
          <code>{first.contractId}</code>
          <span class="feed-call-method">{first.method}</span>
        </span>
      ) : (
        <span class="feed-call-contract">
          {shit_1170_transfer_icon_fun(
            props.tokens.get(transfer.token_id) ?? null,
          )}
          {shit_1170_transfer_amount_fun({
            amount: transfer.amount,
            token: props.tokens.get(transfer.token_id) ?? null,
            contract_id: transfer.token_id,
          })}
          <span class="feed-call-arrow" aria-hidden="true">
            &rarr;
          </span>
          <code>{first.contractId}</code>
          <span class="feed-call-method">{first.method}</span>
        </span>
      )}
      {/* --- WHY --- THE ARGS ARE ON THE POST: the reader is about to
          SIGN this. the amount says how much moves, and the args say
          what the call actually asks for — the receiver, the token, the
          memo. a post that showed the amount but not the args would
          leave the reader signing something they have not read.

          --- WHY --- THE ARGS ARE SHOWN AS ONE LINE AND NOT A JSON BLOCK:
          the post is small. the queue page carries the full args of
          every call. */}
      {args_summary_fun(first.args) !== null && (
        <code class="feed-call-args">{args_summary_fun(first.args)}</code>
      )}
      {/* --- WHY --- THE COUNT IS SHOWN ONLY FOR A BATCH: one call needs
          no count. a batch of three says so, so the reader knows the
          post is showing one of three. */}
      {props.queue.transactions.length > 1 && (
        <span class="feed-call-more">
          +{props.queue.transactions.length - 1} more
        </span>
      )}
    </div>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
