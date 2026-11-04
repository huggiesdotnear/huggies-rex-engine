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
        </span>
      )}
    </div>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
