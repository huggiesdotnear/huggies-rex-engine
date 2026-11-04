// ========================================
// the queue page's transfers: the ft transfers the batch's calls make.
//
// --- WHY IT IS ITS OWN COMPONENT AND NOT PART OF THE CALLS LIST: the
// calls list is about the CALLS — the contract, the method and the raw
// arguments. this is about the TOKENS — what moves, how much and what
// it is worth. two readings of the same transaction, laid out
// differently.
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
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_QUEUE_STORE } from "../../ts/queue/app_page_queue_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import {
  shit_1170_transfer_amount_fun,
  shit_1170_transfer_icon_fun,
} from "../shared/transfer_amount";
import { shit_1170_queue_transfers_fun } from "../../ts/shared/queue_transfers";
import type { SHIT_1170_QUEUE_TRANSFER } from "../../ts/shared/queue_transfers";
import type { SHIT_1170_TRANSFER_TOKEN } from "../../ts/shared/transfer_tokens";
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
export function SHIT_1170_COMPONENT_QUEUE_TRANSFERS_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_QUEUE_STORE);
  const queue = state.queue;
  if (queue === null) return null;
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
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_QUEUE_TRANSFERS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_QUEUE_TRANSFERS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
