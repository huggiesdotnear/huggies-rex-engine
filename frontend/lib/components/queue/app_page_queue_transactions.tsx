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
// --- WHY A CALL WITH RAW BYTES SHOWS A HEX PREVIEW AND NOT JSON: some
// contracts take their arguments as raw bytes — the FastFS protocol
// (`__fastdata_fastfs`) wants borsh bytes — and those bytes are not
// json. printing them as json would show a reader a broken blob that
// says nothing. the byte count and the hex say what the bytes are.
//
// --- WHY A FASTFS CALL SHOWS THE FASTFS CARD: a FastFS upload is a
// FILE, and a file shown as a wall of hex says nothing about it. the
// card decodes the bytes and shows the file, the link and the preview.
//
// --- WHY THE CARD IS ABOVE THE HEX AND NOT INSTEAD OF IT: the hex is
// what the chain will get, and a reader checking the bytes wants them.
// the card is what the bytes MEAN, and it goes first.
//
// mounts into <div id="SHIT_1170_COMPONENT_QUEUE_TRANSACTIONS">.
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_QUEUE_STORE } from "../../ts/queue/app_page_queue_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { shit_1170_code_block_fun } from "../tx/code_block";
import { shit_1170_fastfs_card_fun } from "../tx/app_page_tx_fastfs_card";
import { shit_1170_queue_args_fun } from "../../ts/shared/queue_args";
import { SHIT_1170_AUTH } from "../../ts/shared/auth_status";
import type { SHIT_1170_TX_QUEUE_TRANSACTION } from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the account the batch is FOR — the one that will sign it.
//
// --- WHY THE FIRST ACCOUNT OF THE BATCH AND NOT THE READER: the
// predecessor of a FastFS file is the account that SIGNS the upload,
// and the batch is queued for a set of accounts. the reader may be
// looking at a batch that is not theirs, and the reader's account may
// not be on it at all.
//
// --- WHY THE READER IS THE FALLBACK: a batch with no accounts on it
// is a batch nobody has picked up yet, and the reader looking at it is
// the one who will most likely sign it. so the reader's account is the
// best guess for the signer.
//
// --- WHY THE EMPTY STRING IS THE LAST FALLBACK: a card with no
// predecessor has no url to show, and a url with an empty host is
// worse than no url. the card shows what it can.
function predecessor_fun(accounts: ReadonlyArray<{ accountId: string }>): string {
  const first = accounts[0];
  if (first !== undefined) return first.accountId;
  const reader = SHIT_1170_AUTH.get_account_id();
  return reader ?? "";
}

// one transaction: its position, its contract and method, its gas and
// deposit, and its arguments.
//
// --- WHY THE GAS AND THE DEPOSIT ARE SHOWN AS THEY WERE WRITTEN: the
// queue stores what the agent wrote — "30 Tgas", "1 NEAR" — and that is
// the thing the reader can check against the agent's own words.
function transaction_fun(
  transaction: SHIT_1170_TX_QUEUE_TRANSACTION,
  predecessor: string,
): preact.JSX.Element {
  const args = shit_1170_queue_args_fun(transaction);
  // the FastFS card, when this call is a FastFS upload. it is null for
  // every other call.
  //
  // --- WHY THE CARD DECODES THE BASE64 ITSELF: the card is given the
  // base64 the queue carries, and it turns it into bytes with the
  // client's own lossless decoder. the text decoder the hex preview
  // uses would mangle a binary payload — a png is not utf-8.
  const fastfs =
    transaction.argsBase64 === null ||
    transaction.argsBase64 === undefined
      ? null
      : shit_1170_fastfs_card_fun({
          args_base64: transaction.argsBase64,
          method_name: transaction.method,
          predecessor,
          receiver: transaction.contractId,
          // --- WHY IT IS NOT ON CHAIN: the batch is queued. nobody has
          // signed it yet, so the file is not indexed and its url has
          // nothing at it.
          is_on_chain: false,
        });
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
      {fastfs}
      {args.binary ? (
        <div class="queue-transaction-binary">
          <span class="queue-transaction-binary-label">
            RAW BYTES — {args.byte_length} BYTE
            {args.byte_length === 1 ? "" : "S"}
          </span>
          <pre class="queue-transaction-binary-hex">
            <code>{args.hex}</code>
          </pre>
        </div>
      ) : (
        shit_1170_code_block_fun({
          code: args.json,
        })
      )}
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
  // the account the batch is for — the one that will sign it, and so
  // the predecessor of any FastFS file in it.
  const predecessor = predecessor_fun(queue.accounts);
  return (
    <section class="queue-transactions">
      <h2>CALLS ({transactions.length})</h2>
      <div class="queue-transactions-list">
        {transactions.map((transaction) => (
          <div key={transaction.txId}>
            {transaction_fun(transaction, predecessor)}
          </div>
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
