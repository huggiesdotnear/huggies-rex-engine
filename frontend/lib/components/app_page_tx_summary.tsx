// ========================================
// the transaction's own card on the transaction page: the hash, the
// signer, the receiver, the block, the time, the gas and the status.
//
// it reads the loaded transaction from the page's store. it fetches
// nothing.
import { render } from "preact";
import {
  format_gas,
  format_near_with_unit,
  time_ago,
} from "@sleet-js/fastnear-explorer-api-client";
import { HUGGIES_MOUNT_ID } from "../ts/shared/mount_ids";
import { HUGGIES_APP_PAGE_TX_STORE } from "../ts/tx/app_page_tx_store";
import { use_page_store_fun } from "../ts/shared/use_page_store";
import { current_app_depth_fun } from "../ts/shared/app_depth";
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
// --- EXACT TIME ------------------------
// the exact time of the transaction, in UTC.
//
// --- WHY --- THE TIMESTAMP COMES AS NANOSECONDS: that is what the api
// sends, and a reader cannot read a nanosecond count. it is divided
// down to milliseconds and written out as a date.
//
// --- WHY --- UTC AND NOT THE READER'S OWN TIME ZONE: the chain's time
// is one time, and saying it in UTC says the same thing to everyone.
function exact_time_fun(timestamp: string): string {
  const nanoseconds = Number(timestamp);
  if (!Number.isFinite(nanoseconds)) return timestamp;
  const milliseconds = Math.floor(nanoseconds / 1_000_000);
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) return timestamp;
  return `${date.toISOString().replace("T", " ").slice(0, 19)} UTC`;
}
// ========================================
// ========================================
// --- STATUS ---------------------------
// the status word and its state class.
//
// --- WHY --- the status is tri-state: a transaction that has not
// settled yet is neither a success nor a failure, and saying "OK" for
// it would be a lie.
function status_fun(is_success: boolean | null): {
  label: string;
  class_name: string;
} {
  if (is_success === null)
    return { label: "PENDING", class_name: "is-pending" };
  if (is_success) return { label: "SUCCESS", class_name: "is-success" };
  return { label: "FAILED", class_name: "is-failed" };
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function HUGGIES_COMPONENT_TX_SUMMARY_FUN() {
  const state = use_page_store_fun(HUGGIES_APP_PAGE_TX_STORE);
  const data = state.data;
  // no transaction yet — there is nothing to show.
  if (data === null) return null;
  const parsed = data.parsed;
  const status = status_fun(parsed.is_success);
  // the total gas burnt: the transaction's own gas plus every
  // receipt's.
  let total_gas = 0;
  let total_burnt = 0n;
  for (const receipt of parsed.receipts) {
    total_gas += receipt.execution_outcome.outcome.gas_burnt;
    total_burnt += BigInt(receipt.execution_outcome.outcome.tokens_burnt);
  }
  const tx_gas = data.raw.execution_outcome.outcome.gas_burnt;
  total_gas += tx_gas;
  total_burnt += BigInt(data.raw.execution_outcome.outcome.tokens_burnt);

  return (
    <section class="tx-summary">
      <h1>TRANSACTION</h1>
      <div class="tx-summary-card">
        <div class="tx-summary-row">
          <span class="tx-summary-label">HASH</span>
          <code class="tx-summary-value">{parsed.hash}</code>
        </div>
        <div class="tx-summary-row">
          <span class="tx-summary-label">STATUS</span>
          <span class={`tx-summary-value ${status.class_name}`}>
            {status.label}
          </span>
        </div>
        <div class="tx-summary-row">
          <span class="tx-summary-label">SIGNER</span>
          <a class="tx-summary-value" href={account_href_fun(parsed.signer_id)}>
            {parsed.signer_id}
          </a>
        </div>
        {parsed.relayer_id !== null && (
          <div class="tx-summary-row">
            <span class="tx-summary-label">RELAYED BY</span>
            <a
              class="tx-summary-value"
              href={account_href_fun(parsed.relayer_id)}
            >
              {parsed.relayer_id}
            </a>
          </div>
        )}
        <div class="tx-summary-row">
          <span class="tx-summary-label">RECEIVER</span>
          <a
            class="tx-summary-value"
            href={account_href_fun(parsed.receiver_id)}
          >
            {parsed.receiver_id}
          </a>
        </div>
        <div class="tx-summary-row">
          <span class="tx-summary-label">BLOCK</span>
          <span class="tx-summary-value">{parsed.block_height}</span>
        </div>
        <div class="tx-summary-row">
          <span class="tx-summary-label">TIME</span>
          <span class="tx-summary-value">
            {time_ago(parsed.timestamp)}
            {/* --- WHY --- THE EXACT TIME IS SHOWN AND NOT THE RAW
                NANOSECONDS: the timestamp comes as nanoseconds since
                the epoch, and "1793489431259123500" is not a time a
                reader can read. */}
            <span class="tx-summary-sub">
              {exact_time_fun(parsed.timestamp)}
            </span>
          </span>
        </div>
        <div class="tx-summary-row">
          <span class="tx-summary-label">GAS BURNT</span>
          <span class="tx-summary-value">{format_gas(total_gas)}</span>
        </div>
        <div class="tx-summary-row">
          <span class="tx-summary-label">NEAR BURNT</span>
          <span class="tx-summary-value">
            {format_near_with_unit(total_burnt.toString())}
          </span>
        </div>
        {parsed.public_key !== undefined && (
          <div class="tx-summary-row">
            <span class="tx-summary-label">PUBLIC KEY</span>
            <code class="tx-summary-value">{parsed.public_key}</code>
          </div>
        )}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TX_SUMMARY;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_TX_SUMMARY_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
