// ========================================
// the queue page's transfers widget: the tokens the batch's calls ask to
// move.
//
// --- WHY IT IS A WIDGET AND NOT A SECTION OF THE PAGE: a transfer is
// ONE kind of thing a batch asks for, and it stands beside the files
// rather than inside the calls. the widget says whether it applies, and
// the page says where it sits.
//
// --- WHY IT IS THE ONLY TRANSFER WIDGET: the fastnear explorer shows
// the same transfer twice — once in its TRANSFERS section, which comes
// from the log events, and once in its own ft-transfer widget, which
// comes from the action. a reader sees one transfer here and one
// transfer there and cannot tell whether they are two transfers or one.
// so the transfers come from one reading, once.
//
// --- WHY THESE TRANSFERS ARE INFERRED AND NOT READ: a queued
// transaction has no chain records yet — nothing has happened. the tx
// page reads what HAPPENED, the events in the receipt logs. this reads
// what the agent ASKED FOR, the arguments, by the standard's fixed arg
// names. the two readings are different facts at different stages, and
// they are NOT merged into one function. they share the LOOK — the
// shared transfer amount — and not the source.
//
// --- WHY THE RENDERING IS THE SHARED ONE: the token's icon, the amount
// divided by its decimals, the symbol and the usd worth all come from
// the shared transfer amount component. a queued transfer and a
// finished transfer must read identically.
//
// --- WHY A BATCH THAT MOVES NO TOKEN SHOWS NOTHING: the honest answer.
// the calls list still carries the whole story, so nothing is hidden.
//
// mounts into <div id="SHIT_1170_COMPONENT_QUEUE_TRANSFERS">.
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_QUEUE_STORE } from "../../../ts/queue/app_page_queue_store";
import { use_page_store_fun } from "../../../ts/shared/use_page_store";
import {
  shit_1170_transfer_amount_fun,
  shit_1170_transfer_icon_fun,
} from "../../shared/transfer_amount";
import { shit_1170_queue_transfers_fun } from "../../../ts/shared/queue_transfers";
import { SHIT_1170_QUEUE_WIDGETS } from "./queue_widgets";
import type { SHIT_1170_QUEUE_TRANSFER } from "../../../ts/shared/queue_transfers";
import type { SHIT_1170_TRANSFER_TOKEN } from "../../../ts/shared/transfer_tokens";
// ========================================
// ========================================
// --- ROW -------------------------------
// one transfer: the token's icon, the amount and the receiver.
function transfer_fun(
  transfer: SHIT_1170_QUEUE_TRANSFER,
  token: SHIT_1170_TRANSFER_TOKEN | null,
): preact.JSX.Element {
  return (
    <div class="queue-transfer">
      <div class="queue-transfer-amount">
        {shit_1170_transfer_icon_fun(token)}
        {shit_1170_transfer_amount_fun({
          amount: transfer.amount,
          token,
          contract_id: transfer.token_id,
        })}
      </div>
      <div class="queue-transfer-meta">
        <span class="queue-transfer-method">{transfer.method}</span>
        {transfer.receiver_id !== null && (
          <code class="queue-transfer-receiver">{transfer.receiver_id}</code>
        )}
      </div>
    </div>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_QUEUE_WIDGET_TRANSFERS_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_QUEUE_STORE);
  const queue = state.queue;
  if (queue === null) return null;
  // --- WHY --- THE REGISTRY DECIDES: this widget applies when the
  // batch asks for a token to move, and the registry is where that is
  // written down. the widget does not carry its own rule, so there is
  // ONE place that says which widgets apply to a batch.
  if (!SHIT_1170_QUEUE_WIDGETS.applies("transfers", queue)) return null;
  const transfers = shit_1170_queue_transfers_fun(queue);
  // a batch that moves no token shows no transfers section.
  if (transfers.length === 0) return null;
  return (
    <section class="queue-transfers">
      <h2>TRANSFERS ({transfers.length})</h2>
      <div class="queue-transfers-list">
        {transfers.map((transfer, index) => (
          <div key={`${transfer.method}-${index}`}>
            {transfer_fun(
              transfer,
              state.tokens.get(transfer.token_id) ?? null,
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
//
// --- WHY --- THE MOUNT ID DID NOT CHANGE: the page's divs and their
// order are the page's layout, and a widget does not move the page's
// layout around. the id is the page's, and the widget answers to it.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_QUEUE_TRANSFERS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<SHIT_1170_COMPONENT_QUEUE_WIDGET_TRANSFERS_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
