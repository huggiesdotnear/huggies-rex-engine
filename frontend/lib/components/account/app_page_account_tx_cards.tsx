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
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_ACCOUNT_TX_DETAIL_STORE } from "../../ts/account/app_page_account_tx_details_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { current_app_depth_fun } from "../../ts/shared/app_depth";
import { tx_detail_href_fun } from "../../ts/shared/tx_link";
import { transfer_token_of_fun } from "../../ts/shared/transfer_tokens";
import type { SHIT_1170_TRANSFER_TOKEN } from "../../ts/shared/transfer_tokens";
import { SHIT_1170_TRANSFER_TOKENS_STORE } from "../../ts/shared/transfer_tokens_store";
import { shit_1170_account_tab_view_fun } from "./app_page_account_tab_view";
import type { SHIT_1170_APP_PAGE_ACCOUNT_TX_DETAIL_STATE } from "../../ts/account/app_page_account_tx_details_store";
import {
  shit_1170_transfer_amount_fun,
  shit_1170_transfer_icon_fun,
} from "../shared/transfer_amount";
import type { SHIT_1170_APP_PAGE_ACCOUNT_TX_DETAIL } from "../../ts/account/app_page_account_tx_details";
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
//
// --- WHY THE TOKENS ARE A PARAMETER AND NOT READ FROM THE STORE: the
// cards are five transactions, and each one names its own tokens. the
// tokens are gathered for the whole set and handed in, so the card
// renders without reaching for anything.
function detail_card_fun(
  detail: SHIT_1170_APP_PAGE_ACCOUNT_TX_DETAIL,
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>,
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
        <a href={account_href_fun(parsed.receiver_id)}>{parsed.receiver_id}</a>
      </div>
      <div class="tx-card-row">
        <span class="tx-card-label">GAS</span>
        <span>{format_gas(parsed.gas_burnt)}</span>
      </div>
      {actions.length > 0 && (
        <div class="tx-card-row">
          <span class="tx-card-label">ACTION</span>
          <span class="tx-card-actions">
            {actions.slice(0, 3).map((action) => (
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
            {transfers.slice(0, 2).map((transfer) => {
              const token = transfer_token_of_fun(
                transfer.token_type,
                transfer.contract_id,
                transfer.token_id,
                tokens,
              );
              return (
                <span class="tx-card-transfer">
                  {shit_1170_transfer_icon_fun(token)}
                  {transfer.token_type === "near" ? (
                    <span class="tx-token-value">
                      {format_near_with_unit(transfer.amount)}
                    </span>
                  ) : (
                    shit_1170_transfer_amount_fun({
                      amount: transfer.amount,
                      token,
                    })
                  )}
                  <span class="tx-token-standard">
                    {transfer.token_type.toUpperCase()}
                  </span>
                </span>
              );
            })}
            {nft_transfers.length > 0 && (
              <span class="tx-card-transfer">{nft_transfers.length} NFT</span>
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
export function SHIT_1170_COMPONENT_ACCOUNT_TX_CARDS_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_ACCOUNT_TX_DETAIL_STORE);
  const token_state = use_page_store_fun(SHIT_1170_TRANSFER_TOKENS_STORE);
  // --- WHY THE CARDS BELONG TO THE TRANSACTIONS TAB: the account
  // page's tab decides what the page shows, and the balances and the
  // transactions are two views of the same account. without this gate
  // the cards stayed on screen after the reader switched to the
  // balances tab — they were fetched for the transactions tab, but
  // nothing said they belonged to it.
  //
  // the gate is the SAME one the balance tables use, so both sides of
  // the page decide the same way.
  return (
    <>
      {shit_1170_account_tab_view_fun({
        tab: "transactions",
        children: shit_1170_tx_cards_fun(state, token_state.tokens),
      })}
    </>
  );
}

// the cards themselves, once the tab gate has said the transactions
// tab is the one on screen.
//
// --- WHY THIS IS ITS OWN FUNCTION: the gate takes children, so the
// cards are built as a value and handed to it. that keeps the gate
// the single thing that decides what is on screen.
function shit_1170_tx_cards_fun(
  state: SHIT_1170_APP_PAGE_ACCOUNT_TX_DETAIL_STATE,
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>,
): preact.JSX.Element | null {
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
          <div key={detail.hash}>{detail_card_fun(detail, tokens)}</div>
        ))}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_ACCOUNT_TX_CARDS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_ACCOUNT_TX_CARDS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
