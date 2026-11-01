// ========================================
// the account's newest transactions as cards: the signer, the receiver,
// what it did and what it moved.
//
// --- WHY --- THE CARDS AND NOT THE TABLE: the table below shows the
// account's whole history and it is cheap, because the history
// endpoint answers with a row per transaction. it does NOT carry the
// signer, the receiver or the actions — those are in the full
// transaction, which is thirteen times bigger and takes twenty hashes
// per call.
//
// so the newest few get their full transaction fetched and are shown
// as cards, and the list below keeps scrolling forever.
//
// it reads the loaded details from the page's store. it fetches
// nothing itself.
import { render } from "preact";
import {
  format_gas,
  format_near_with_unit,
  time_ago,
} from "@sleet-js/fastnear-explorer-api-client";
import { CircleCheck, CircleX } from "lucide-preact";
import { HUGGIES_MOUNT_ID } from "../ts/shared/mount_ids";
import { HUGGIES_APP_PAGE_ACCOUNT_TX_DETAIL_STORE } from "../ts/account/app_page_account_tx_details_store";
import { use_page_store_fun } from "../ts/shared/use_page_store";
import { current_app_depth_fun } from "../ts/shared/app_depth";
import { tx_detail_href_fun } from "../ts/account/app_page_account_tx_link";
import type { HUGGIES_APP_PAGE_ACCOUNT_TX_DETAIL } from "../ts/account/app_page_account_tx_details";
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
// --- ACTION ---------------------------
// the action's kind and, for a function call, its method.
//
// --- WHY --- THE METHOD NAME AND NOT THE WHOLE ACTION: a card is a
// summary. the whole action, with its arguments, is on the
// transaction's own page.
function action_label_fun(type: string, method_name?: string): string {
  if (method_name !== undefined && method_name.length > 0) {
    return method_name;
  }
  return type;
}
// ========================================
// ========================================
// --- CARD -----------------------------
// one transaction: what it was, who did it, what it did and what it
// moved.
function detail_card_fun(
  detail: HUGGIES_APP_PAGE_ACCOUNT_TX_DETAIL,
): preact.JSX.Element {
  const parsed = detail.parsed;
  const depth = current_app_depth_fun();
  const tx_href = tx_detail_href_fun(detail.hash, depth);
  const transfers = parsed.transfers;
  const nft_transfers = parsed.nft_transfers;
  const actions = parsed.actions;
  return (
    <div class="tx-card">
      <div class="tx-card-head">
        <a class="tx-card-hash" href={tx_href}>
          {detail.hash}
        </a>
        {parsed.is_success === null ? (
          <span class="tx-card-status is-pending">PENDING</span>
        ) : parsed.is_success ? (
          <CircleCheck
            size={16}
            class="tx-card-status is-success"
            aria-label="succeeded"
            title="SUCCEEDED"
          />
        ) : (
          <CircleX
            size={16}
            class="tx-card-status is-failed"
            aria-label="failed"
            title="FAILED"
          />
        )}
      </div>
      <div class="tx-card-row">
        <span class="tx-card-label">TIME</span>
        <span>{time_ago(parsed.timestamp)}</span>
      </div>
      <div class="tx-card-row">
        <span class="tx-card-label">SIGNER</span>
        <a href={account_href_fun(parsed.signer_id)}>{parsed.signer_id}</a>
      </div>
      <div class="tx-card-row">
        <span class="tx-card-label">RECEIVER</span>
        <a href={account_href_fun(parsed.receiver_id)}>
          {parsed.receiver_id}
        </a>
      </div>
      <div class="tx-card-row">
        <span class="tx-card-label">GAS</span>
        <span>{format_gas(parsed.gas_burnt)}</span>
      </div>
      {actions.length > 0 && (
        <div class="tx-card-row">
          <span class="tx-card-label">ACTION</span>
          <span class="tx-card-actions">
            {actions
              .slice(0, 3)
              .map((action) => (
                <span class="tx-card-action">
                  {action_label_fun(action.type, action.method_name)}
                </span>
              ))}
            {actions.length > 3 && (
              <span class="tx-card-action">+{actions.length - 3}</span>
            )}
          </span>
        </div>
      )}
      {transfers.length > 0 && (
        <div class="tx-card-row">
          <span class="tx-card-label">MOVED</span>
          <span class="tx-card-transfers">
            {transfers.slice(0, 2).map((transfer) => (
              <span class="tx-card-transfer">
                {transfer.token_type === "near"
                  ? format_near_with_unit(transfer.amount)
                  : transfer.amount}{" "}
                {transfer.token_type.toUpperCase()}
              </span>
            ))}
            {nft_transfers.length > 0 && (
              <span class="tx-card-transfer">
                {nft_transfers.length} NFT
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function HUGGIES_COMPONENT_ACCOUNT_TX_CARDS_FUN() {
  const state = use_page_store_fun(HUGGIES_APP_PAGE_ACCOUNT_TX_DETAIL_STORE);
  // nothing loaded yet — the section says so and shows nothing else.
  if (state.details.length === 0) {
    if (state.loading) {
      return (
        <section class="tx-cards">
          <h2>LATEST TRANSACTIONS</h2>
          <p class="tx-cards-note">LOADING...</p>
        </section>
      );
    }
    if (state.error !== null) {
      return (
        <section class="tx-cards">
          <h2>LATEST TRANSACTIONS</h2>
          <p class="tx-cards-note is-error">{state.error}</p>
        </section>
      );
    }
    return null;
  }
  return (
    <section class="tx-cards">
      <h2>LATEST TRANSACTIONS</h2>
      <div class="tx-cards-list">
        {state.details.map((detail) => (
          <div key={detail.hash}>{detail_card_fun(detail)}</div>
        ))}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_ACCOUNT_TX_CARDS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_ACCOUNT_TX_CARDS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
