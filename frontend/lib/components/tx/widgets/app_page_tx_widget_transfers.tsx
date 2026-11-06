// ========================================
// the transfers widget: the transaction's transfers — what moved, and
// where.
//
// the fungible transfers and the nft transfers are shown as one list,
// because a reader asks the same question of both — what did this
// transaction move.
//
// each row carries the token's ICON and SYMBOL next to the amount, so
// "1.5 USDC" reads as an amount of USDC and not as a bare integer in
// the token's smallest unit. the raw integer is in the title, for a
// reader who wants the exact number the chain recorded.
//
// --- WHY --- IT IS A WIDGET AND NOT A SECTION OF THE PAGE: the
// transfers are ONE kind of thing the transaction did, and a reader who
// wants a different kind of thing — the files, say — should not have to
// read the transfers to get it. the widget says whether it applies, and
// the page says where it sits.
//
// --- WHY --- IT IS THE ONLY TRANSFER WIDGET: the fastnear explorer
// shows the same transfer twice — once in its TRANSFERS section, which
// comes from the log events, and once in its own ft-transfer widget,
// which comes from the action. a reader sees one transfer here and one
// transfer there and cannot tell whether they are two transfers or one.
// so the transfers come from the log events, once.
//
// it reads the loaded transaction from the page's store. it fetches
// nothing — the tokens come from the shared transfer tokens store.
import { render } from "preact";
import { format_near_with_unit } from "@sleet-js/fastnear-explorer-api-client";
import { SHIT_1170_MOUNT_ID } from "../../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_TX_STORE } from "../../../ts/tx/app_page_tx_store";
import { use_page_store_fun } from "../../../ts/shared/use_page_store";
import { current_app_depth_fun } from "../../../ts/shared/app_depth";
import { SHIT_1170_TRANSFER_TOKENS_STORE } from "../../../ts/shared/transfer_tokens_store";
import { transfer_token_of_fun } from "../../../ts/shared/transfer_tokens";
import {
  shit_1170_transfer_amount_fun,
  shit_1170_transfer_icon_fun,
} from "../../shared/transfer_amount";
import { shit_1170_transfer_memo_fun } from "./app_page_tx_widget_transfer_memo";
import { SHIT_1170_TX_WIDGETS } from "./tx_widgets";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the account link for an account id.
//
// --- WHY the depth is asked for here and not baked in: the page
// can sit at any depth under /app/, and a link built for the wrong
// depth lands on a page that does not exist.
function account_href_fun(account_id: string): string {
  const depth = current_app_depth_fun();
  return `${"../".repeat(depth)}account.html?id=${encodeURIComponent(account_id)}`;
}
// ========================================
// ========================================
// --- ENDPOINT -------------------------
// one end of a transfer: the account, or the words for a mint or a
// burn.
//
// --- WHY --- the api says a mint by having no sender and a burn by
// having no receiver. "MINT" and "BURN" say what happened, where an
// empty cell would say nothing.
function endpoint_fun(account_id: string | null): preact.JSX.Element {
  if (account_id === null) return <span class="tx-transfer-mint">MINT</span>;
  return (
    <a class="tx-transfer-account" href={account_href_fun(account_id)}>
      {account_id}
    </a>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_TX_WIDGET_TRANSFERS_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_TX_STORE);
  const token_state = use_page_store_fun(SHIT_1170_TRANSFER_TOKENS_STORE);
  const data = state.data;
  // no transaction yet — there is nothing to show.
  if (data === null) return null;
  const parsed = data.parsed;
  // --- WHY --- THE REGISTRY DECIDES: this widget applies when the
  // transaction moved something, and the registry is where that is
  // written down. the widget does not carry its own rule, so there is
  // ONE place that says which widgets apply to a transaction.
  if (!SHIT_1170_TX_WIDGETS.applies("transfers", parsed)) return null;
  const transfers = parsed.transfers;
  const nft_transfers = parsed.nft_transfers;
  // a transaction that moved nothing has no transfers section.
  if (transfers.length === 0 && nft_transfers.length === 0) return null;
  const tokens = token_state.tokens;

  return (
    <section class="tx-transfers">
      <h2>TRANSFERS ({transfers.length + nft_transfers.length})</h2>
      <div class="tx-transfers-list">
        {transfers.map((transfer, index) => {
          const token = transfer_token_of_fun(
            transfer.token_type,
            transfer.contract_id,
            transfer.token_id,
            tokens,
          );
          return (
            <div class="tx-transfer" key={`ft-${index}`}>
              <div class="tx-transfer-line">
                {endpoint_fun(transfer.from)}
                <span class="tx-transfer-arrow">&rarr;</span>
                {endpoint_fun(transfer.to)}
              </div>
              <div class="tx-transfer-amount">
                {shit_1170_transfer_icon_fun(token)}
                {/* --- WHY --- a NEAR amount is formatted by the client
                    and a TOKEN amount by the shared token amount: the
                    native token has no registry entry, so its decimals
                    are the protocol's own 24, and the client already
                    knows them. */}
                {transfer.token_type === "near" ? (
                  <span class="tx-token-amount">
                    <span class="tx-token-value">
                      {format_near_with_unit(transfer.amount)}
                    </span>
                  </span>
                ) : (
                  shit_1170_transfer_amount_fun({
                    amount: transfer.amount,
                    token,
                    contract_id: transfer.contract_id,
                  })
                )}
                {/* --- WHY --- THE STANDARD IS STILL SHOWN: the symbol
                    says WHICH token, and the standard says WHAT KIND
                    of token it is. a nep245 row carries a token id as
                    well, and that id is only meaningful next to the
                    standard. */}
                <span class="tx-transfer-type">
                  {transfer.token_type.toUpperCase()}
                </span>
                {transfer.token_id !== undefined && (
                  <code class="tx-transfer-token-id">{transfer.token_id}</code>
                )}
              </div>
              {transfer.memo !== undefined &&
                transfer.memo.length > 0 &&
                shit_1170_transfer_memo_fun({ memo: transfer.memo })}
            </div>
          );
        })}
        {nft_transfers.map((transfer, index) => {
          // --- WHY --- an nft's collection is a contract in the token
          // registry like any other, so its icon is the collection's
          // icon — the one a reader recognises the nft by.
          const token = tokens.get(transfer.contract_id) ?? null;
          return (
            <div class="tx-transfer" key={`nft-${index}`}>
              <div class="tx-transfer-line">
                {endpoint_fun(transfer.from)}
                <span class="tx-transfer-arrow">&rarr;</span>
                {endpoint_fun(transfer.to)}
              </div>
              <div class="tx-transfer-amount">
                {shit_1170_transfer_icon_fun(token)}
                <code class="tx-transfer-token-id">{transfer.token_id}</code>
                {token !== null && (
                  <span class="tx-token-symbol">{token.symbol}</span>
                )}
                <span class="tx-transfer-type">NFT</span>
                <code class="tx-transfer-contract">{transfer.contract_id}</code>
              </div>
              {transfer.memo !== undefined &&
                transfer.memo.length > 0 &&
                shit_1170_transfer_memo_fun({ memo: transfer.memo })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
//
// --- WHY --- THE MOUNT ID DID NOT CHANGE: the page's divs and their
// order are the page's layout, and a widget does not move the page's
// layout around. the id is the page's, and the widget answers to it.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_TX_TRANSFERS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<SHIT_1170_COMPONENT_TX_WIDGET_TRANSFERS_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
