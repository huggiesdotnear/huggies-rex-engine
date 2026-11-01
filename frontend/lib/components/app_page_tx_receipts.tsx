// ========================================
// the transaction's receipts: the work the transaction caused, and what
// came of it.
//
// each receipt is a card: what it was, who ran it, when, what it burnt,
// what it did, what it came back with and what it logged.
//
// --- WHY --- THE CARD SHOWS THE RECEIPT'S OWN FIELDS: a receipt is a
// step of the work, not a copy of the transaction. the explorer shows
// the same fields — the id, the predecessor, the receiver, the block,
// the time, the gas, the tokens and the actions.
//
// --- WHY --- THE TEXT IS LEFT ALIGNED: the app's column is centred
// (base/main.css), and a card of facts reads badly down the middle of
// the screen.
//
// it reads the loaded transaction from the page's store. it fetches
// nothing.
import { render } from "preact";
import {
  format_gas,
  format_near_with_unit,
  get_action_payload,
  get_action_type,
  parse_event_json,
  time_ago,
} from "@sleet-js/fastnear-explorer-api-client";
import { CircleCheck, CircleX } from "lucide-preact";
import { HUGGIES_MOUNT_ID } from "../ts/shared/mount_ids";
import { HUGGIES_APP_PAGE_TX_STORE } from "../ts/tx/app_page_tx_store";
import { use_page_store_fun } from "../ts/shared/use_page_store";
import { current_app_depth_fun } from "../ts/shared/app_depth";
import { app_page_tx_action_args_fun } from "../ts/tx/app_page_tx_action_args";
import { huggies_code_block_fun } from "./shared/code_block";
import { huggies_args_viewer_fun } from "./app_page_tx_args_viewer";
import type {
  ACTION,
  RECEIPT_WITH_OUTCOME,
} from "@sleet-js/fastnear-explorer-api-client";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the account link for an account id.
//
// --- WHY --- the depth is asked for here and not baked in: the page
// can sit at any depth under /app/, and a link built for the wrong
// depth lands on a page that does not exist.
function account_href_fun(account_id: string): string {
  const depth = current_app_depth_fun();
  return `${"../".repeat(depth)}account.html?id=${encodeURIComponent(account_id)}`;
}
// ========================================
// ========================================
// --- ACTION TYPE -----------------------
// the name of an action, and its payload.
//
// --- WHY --- THE CLIENT'S OWN HELPERS ARE USED: the fastnear client
// ships get_action_type and get_action_payload, and they already know
// that an action is either a single-key object or a bare string —
// CreateAccount is a bare string — and that a payload may be missing.
// a second copy of that rule here would be a second chance to drift.
function action_parts_fun(action: ACTION): {
  type: string;
  payload: Record<string, unknown>;
} {
  const type = get_action_type(action);
  if (type === null) {
    return { type: "Unknown", payload: {} };
  }
  const payload = get_action_payload(action);
  if (payload === null) {
    return { type, payload: {} };
  }
  return { type, payload: payload as Record<string, unknown> };
}
// ========================================
// ========================================
// --- RECEIPT ACTION --------------------
// one action of a receipt: what it did, and the details it carried.
//
// --- WHY --- THE RECEIPT'S OWN ACTIONS ARE SHOWN: the transaction's
// actions are what it ASKED for, and a receipt's actions are what the
// work ACTUALLY did. a function call that ran a method is one action
// on the transaction and one action on the receipt.
function receipt_action_fun(action: ACTION): preact.JSX.Element {
  const { type, payload } = action_parts_fun(action);
  const method_name =
    typeof payload.method_name === "string" ? payload.method_name : null;
  const deposit =
    typeof payload.deposit === "string" && payload.deposit !== "0"
      ? payload.deposit
      : null;
  const gas = typeof payload.gas === "number" ? payload.gas : null;
  // the action's arguments, decoded. the base64 goes to the viewer and
  // the action comes back with the arguments replaced by the json they
  // are.
  const args = app_page_tx_action_args_fun(action);

  return (
    <div class="tx-receipt-action">
      <div class="tx-receipt-action-head">
        <span class="tx-receipt-action-type">{method_name ?? type}</span>
        {gas !== null && (
          <span class="tx-receipt-action-gas">{format_gas(gas)}</span>
        )}
        {deposit !== null && (
          <span class="tx-receipt-action-deposit">
            {format_near_with_unit(deposit)}
          </span>
        )}
      </div>
      {/* --- WHY --- THE ACTION IS ONE JSON BLOCK AND NOT A LIST OF
          FIELDS: a receipt's action is one signed object — a key, a
          delete, a function call — and its fields are all json. one
          block shows the whole action, the way the chain signed it,
          with nothing left out and nothing repeated.

          --- WHY --- THE ARGUMENTS IN THE BLOCK ARE DECODED: the chain
          stores them as base64, so the raw action holds a wall of
          base64 that says nothing. the block shows the json they are,
          and the viewer under it holds the same bytes as plain text,
          hex and base64. */}
      {huggies_code_block_fun({
        code: JSON.stringify(args.action, null, 2),
      })}
      {args.base64 !== null &&
        args.decoded !== null &&
        huggies_args_viewer_fun({
          base64: args.base64,
          decoded: args.decoded,
        })}
    </div>
  );
}
// ========================================
// ========================================
// --- RESULT ---------------------------
// the outcome of a receipt: what it came back with, or why it failed.
//
// --- WHY --- THE STATUS IS A UNION AND NOT A FLAG: a receipt can
// succeed with a value, succeed with a receipt to go to, or fail with
// an error. three different things, and the reader wants to see which.
//
// --- WHY --- THE LABELS SAY WHAT HAPPENED: "RETURNED" said nothing —
// returned what? a receipt that succeeded with a value returned that
// value, and one that succeeded with a receipt to go to handed the
// work on. so the first says SUCCESS and the second says the receipt
// the work went to.
function result_fun(receipt: RECEIPT_WITH_OUTCOME): preact.JSX.Element {
  const status = receipt.execution_outcome.outcome.status;
  if ("SuccessValue" in status) {
    return (
      <div class="tx-receipt-result">
        <span class="tx-receipt-result-label">SUCCESS</span>
        <code class="tx-receipt-result-value">{status.SuccessValue}</code>
      </div>
    );
  }
  if ("SuccessReceiptId" in status) {
    return (
      <div class="tx-receipt-result">
        <span class="tx-receipt-result-label">RECEIPT</span>
        {/* --- WHY --- IT LINKS TO THE RECEIPT: the card for that
            receipt is further down the page, with its own anchor. the
            link takes the reader straight to it. */}
        <a
          class="tx-receipt-result-value"
          href={`#receipt-${status.SuccessReceiptId}`}
        >
          {status.SuccessReceiptId}
        </a>
      </div>
    );
  }
  return (
    <div class="tx-receipt-result is-failed">
      <span class="tx-receipt-result-label">FAILED</span>
      {/* --- WHY --- THE FAILURE IS A CODE BLOCK: a failure is json — an
          error kind and a message, sometimes with more under them — and
          the message is the one thing a reader comes to this page for.
          the block shows the whole failure, not just the message. */}
      {huggies_code_block_fun({
        code: JSON.stringify(status.Failure, null, 2),
      })}
    </div>
  );
}
// ========================================
// ========================================
// --- LOG ------------------------------
// one log line of a receipt.
//
// --- WHY --- AN EVENT LOG IS JSON: the contract wrote a json event, and
// showing it in a block says what it was and what it carried. a log
// that is not json is shown as the text it is.
function log_fun(log: string): preact.JSX.Element {
  const event = parse_event_json(log);
  if (event === null) {
    return (
      <div class="tx-receipt-log-text">
        {huggies_code_block_fun({ code: log })}
      </div>
    );
  }
  return (
    <div class="tx-receipt-event">
      <div class="tx-receipt-event-head">
        {event.standard !== undefined && (
          <span class="tx-receipt-event-standard">{event.standard}</span>
        )}
        {event.event !== undefined && (
          <span class="tx-receipt-event-name">{event.event}</span>
        )}
      </div>
      {event.data !== undefined &&
        huggies_code_block_fun({
          code: JSON.stringify(event.data, null, 2),
        })}
    </div>
  );
}
// ========================================
// ========================================
// --- SAME ACTIONS ----------------------
// whether two sets of actions are the same.
//
// --- WHY --- THE FIRST RECEIPT'S ACTIONS ARE THE TRANSACTION'S ACTIONS:
// the first receipt IS the transaction's actions, run. showing them
// twice made the page twice as long and rendered every argument twice,
// for no extra information.
//
// --- WHY --- IT COMPARES THE JSON AND NOT THE OBJECT: the two are
// different objects with the same content, and the content is what
// decides whether the reader would see the same thing twice.
function same_actions_fun(
  a: ReadonlyArray<ACTION>,
  b: ReadonlyArray<ACTION>,
): boolean {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (JSON.stringify(a[index]) !== JSON.stringify(b[index])) {
      return false;
    }
  }
  return true;
}
// ========================================
// ========================================
// --- RECEIPT -------------------------
// one receipt: its facts, its actions, its result and its logs.
function receipt_fun(
  receipt: RECEIPT_WITH_OUTCOME,
  index: number,
  transaction_actions: ReadonlyArray<ACTION>,
): preact.JSX.Element {
  const outcome = receipt.execution_outcome.outcome;
  const receipt_body = receipt.receipt.receipt;
  // the receipt's own actions — what the work did, as against what the
  // transaction asked for.
  const receipt_actions =
    "Action" in receipt_body ? receipt_body.Action.actions : [];
  // the first receipt runs the transaction's own actions, so showing
  // them again would say the same thing twice.
  const actions = same_actions_fun(receipt_actions, transaction_actions)
    ? []
    : receipt_actions;
  const is_success =
    "SuccessValue" in outcome.status || "SuccessReceiptId" in outcome.status;
  return (
    <div class="tx-receipt" id={`receipt-${receipt.receipt.receipt_id}`}>
      <div class="tx-receipt-head">
        <span class="tx-receipt-label">RECEIPT {index + 1}</span>
        <code class="tx-receipt-id">{receipt.receipt.receipt_id}</code>
        {is_success ? (
          <CircleCheck
            size={16}
            class="is-success"
            aria-label="succeeded"
            title="SUCCEEDED"
          />
        ) : (
          <CircleX
            size={16}
            class="is-failed"
            aria-label="failed"
            title="FAILED"
          />
        )}
      </div>
      <div class="tx-receipt-row">
        <span class="tx-receipt-label">PREDECESSOR</span>
        <a href={account_href_fun(receipt.receipt.predecessor_id)}>
          {receipt.receipt.predecessor_id}
        </a>
      </div>
      <div class="tx-receipt-row">
        <span class="tx-receipt-label">RECEIVER</span>
        <a href={account_href_fun(receipt.receipt.receiver_id)}>
          {receipt.receipt.receiver_id}
        </a>
      </div>
      <div class="tx-receipt-row">
        <span class="tx-receipt-label">EXECUTOR</span>
        <a href={account_href_fun(outcome.executor_id)}>
          {outcome.executor_id}
        </a>
      </div>
      <div class="tx-receipt-row">
        <span class="tx-receipt-label">BLOCK</span>
        <span>{receipt.execution_outcome.block_height.toLocaleString()}</span>
      </div>
      <div class="tx-receipt-row">
        <span class="tx-receipt-label">TIME</span>
        <span>{time_ago(receipt.execution_outcome.block_timestamp)}</span>
      </div>
      <div class="tx-receipt-row">
        <span class="tx-receipt-label">GAS BURNT</span>
        <span>{format_gas(outcome.gas_burnt)}</span>
      </div>
      <div class="tx-receipt-row">
        <span class="tx-receipt-label">NEAR BURNT</span>
        <span>{format_near_with_unit(outcome.tokens_burnt)}</span>
      </div>
      {actions.length > 0 && (
        <div class="tx-receipt-actions">
          <span class="tx-receipt-label">ACTIONS</span>
          <div class="tx-receipt-actions-list">
            {actions.map((action, action_index) => (
              <div key={`${action_index}`}>{receipt_action_fun(action)}</div>
            ))}
          </div>
        </div>
      )}
      {result_fun(receipt)}
      {outcome.logs.length > 0 && (
        <div class="tx-receipt-logs">
          <span class="tx-receipt-label">LOGS</span>
          {outcome.logs.map((log, log_index) => (
            <div key={`${log_index}`}>{log_fun(log)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function HUGGIES_COMPONENT_TX_RECEIPTS_FUN() {
  const state = use_page_store_fun(HUGGIES_APP_PAGE_TX_STORE);
  const data = state.data;
  // no transaction yet — there is nothing to show.
  if (data === null) return null;
  const receipts = data.parsed.receipts;
  // a transaction that caused no receipts has no receipts section.
  if (receipts.length === 0) return null;
  // the transaction's actions as the api sent them, so the first
  // receipt's actions can be compared with them.
  const transaction_raw_actions = data.parsed.actions.map(
    (action) => action.raw as ACTION,
  );

  return (
    <section class="tx-receipts">
      <h2>RECEIPTS ({receipts.length})</h2>
      <div class="tx-receipts-list">
        {receipts.map((receipt, index) => (
          <div key={receipt.receipt.receipt_id}>
            {receipt_fun(receipt, index, transaction_raw_actions)}
          </div>
        ))}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TX_RECEIPTS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_TX_RECEIPTS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
