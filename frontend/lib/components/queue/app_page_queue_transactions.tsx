// ========================================
// the queue page's transactions: every call of the batch, in position
// order, with its raw arguments.
//
// --- WHY THE RAW ARGS ARE SHOWN: a queued call is a function call, and
// the arguments are the whole story of what it does. the transfers
// component reads them for the tokens; this component shows them as
// they are, so nothing is hidden.
//
// --- WHY THE POSITION IS SHOWN: the batch is a list, and the order is
// part of it — a swap's legs only make sense in order.
//
// mounts into <div id="SHIT_1170_COMPONENT_QUEUE_TRANSACTIONS">.
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_QUEUE_STORE } from "../../ts/queue/app_page_queue_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { shit_1170_code_block_fun } from "../tx/code_block";
import type { SHIT_1170_TX_QUEUE_TRANSACTION } from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// one transaction: its position, its contract and method, its gas and
// deposit, and its arguments as json.
//
// --- WHY THE GAS AND THE DEPOSIT ARE SHOWN AS THEY WERE WRITTEN: the
// queue stores what the agent wrote — "30 Tgas", "1 NEAR" — and that is
// the thing the reader can check against the agent's own words.
function transaction_fun(
  transaction: SHIT_1170_TX_QUEUE_TRANSACTION,
): preact.JSX.Element {
  return (
    <div class="queue-transaction">
      <div class="queue-transaction-head">
        <span class="queue-transaction-position">
          {String(transaction.position + 1)}
        </span>
        <code class="queue-transaction-contract">{transaction.contractId}</code>
        <span class="queue-transaction-method">{transaction.method}</span>
      </div>
      {(transaction.gas !== null || transaction.deposit !== null) && (
        <div class="queue-transaction-meta">
          {transaction.gas !== null && (
            <span class="queue-transaction-gas">GAS {transaction.gas}</span>
          )}
          {transaction.deposit !== null && (
            <span class="queue-transaction-deposit">
              DEPOSIT {transaction.deposit}
            </span>
          )}
        </div>
      )}
      {shit_1170_code_block_fun({
        code: JSON.stringify(transaction.args ?? {}, null, 2),
      })}
    </div>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_QUEUE_TRANSACTIONS_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_QUEUE_STORE);
  const queue = state.queue;
  if (queue === null) return null;
  const transactions = queue.transactions;
  if (transactions.length === 0) return null;
  return (
    <section class="queue-transactions">
      <h2>CALLS ({transactions.length})</h2>
      <div class="queue-transactions-list">
        {transactions.map((transaction) => (
          <div key={transaction.txId}>{transaction_fun(transaction)}</div>
        ))}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_QUEUE_TRANSACTIONS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_QUEUE_TRANSACTIONS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
