// ========================================
// the transaction's receipts: the work the transaction caused, and what
// came of it.
//
// each receipt is a card: who it ran for, when, what it burnt, what
// it did, what it returned and what it logged.
//
// it reads the loaded transaction from the page's store. it fetches
// nothing.
import { render } from "preact";
import {
  format_gas,
  format_near_with_unit,
  parse_event_json,
  time_ago,
} from "@sleet-js/fastnear-explorer-api-client";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_APP_PAGE_TX_STORE } from "../ts/app_page_tx_store";
import { use_page_store_fun } from "../ts/use_page_store";
import { current_app_depth_fun } from "../ts/app_depth";
import { huggies_json_viewer_fun } from "./app_page_tx_json_viewer";
import type { RECEIPT_WITH_OUTCOME } from "@sleet-js/fastnear-explorer-api-client";
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
// --- RESULT ---------------------------
// the outcome of a receipt: what it returned, or why it failed.
//
// --- WHY --- the status is a union and not a flag: a receipt can
// succeed with a value, succeed with a receipt to go to, or fail with
// an error. three different things, and the reader wants to see which.
function result_fun(receipt: RECEIPT_WITH_OUTCOME): preact.JSX.Element {
  const status = receipt.execution_outcome.outcome.status;
  if ("SuccessValue" in status) {
    return (
      <div class="tx-receipt-result">
        <span class="tx-receipt-result-label">RETURNED</span>
        <code class="tx-receipt-result-value">{status.SuccessValue}</code>
      </div>
    );
  }
  if ("SuccessReceiptId" in status) {
    return (
      <div class="tx-receipt-result">
        <span class="tx-receipt-result-label">RECEIPT</span>
        <code class="tx-receipt-result-value">{status.SuccessReceiptId}</code>
      </div>
    );
  }
  return (
    <div class="tx-receipt-result is-failed">
      <span class="tx-receipt-result-label">FAILED</span>
      {huggies_json_viewer_fun({ value: status.Failure })}
    </div>
  );
}
// ========================================
// ========================================
// --- LOG ------------------------------
// one log line of a receipt.
//
// --- WHY --- an event log is json: the contract wrote a json event, and
// showing it as a tree says what it was and what it carried. a log
// that is not json is shown as the text it is.
function log_fun(log: string): preact.JSX.Element {
  const event = parse_event_json(log);
  if (event === null) {
    return <pre class="tx-receipt-log-text">{log}</pre>;
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
        huggies_json_viewer_fun({ value: event.data })}
    </div>
  );
}
// ========================================
// ========================================
// --- RECEIPT -------------------------
// one receipt: its facts, its result and its logs.
function receipt_fun(
  receipt: RECEIPT_WITH_OUTCOME,
  index: number,
): preact.JSX.Element {
  const outcome = receipt.execution_outcome.outcome;
  return (
    <div class="tx-receipt" id={`receipt-${receipt.receipt.receipt_id}`}>
      <div class="tx-receipt-head">
        <span class="tx-receipt-label">RECEIPT {index + 1}</span>
        <code class="tx-receipt-id">{receipt.receipt.receipt_id}</code>
      </div>
      <div class="tx-receipt-row">
        <span class="tx-receipt-label">EXECUTOR</span>
        <a href={account_href_fun(outcome.executor_id)}>{outcome.executor_id}</a>
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

  return (
    <section class="tx-receipts">
      <h2>RECEIPTS ({receipts.length})</h2>
      <div class="tx-receipts-list">
        {receipts.map((receipt, index) => (
          <div key={receipt.receipt.receipt_id}>
            {receipt_fun(receipt, index)}
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
