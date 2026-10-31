// ========================================
// the transaction's transfers: what moved, and where.
//
// the fungible transfers and the nft transfers are shown as one list,
// because a reader asks the same question of both — what did this
// transaction move.
//
// it reads the loaded transaction from the page's store. it fetches
// nothing.
import { render } from "preact";
import { format_near_with_unit } from "@sleet-js/fastnear-explorer-api-client";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_APP_PAGE_TX_STORE } from "../ts/app_page_tx_store";
import { use_page_store_fun } from "../ts/use_page_store";
import { current_app_depth_fun } from "../ts/app_depth";
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
export function HUGGIES_COMPONENT_TX_TRANSFERS_FUN() {
  const state = use_page_store_fun(HUGGIES_APP_PAGE_TX_STORE);
  const data = state.data;
  // no transaction yet — there is nothing to show.
  if (data === null) return null;
  const parsed = data.parsed;
  const transfers = parsed.transfers;
  const nft_transfers = parsed.nft_transfers;
  // a transaction that moved nothing has no transfers section.
  if (transfers.length === 0 && nft_transfers.length === 0) return null;

  return (
    <section class="tx-transfers">
      <h2>TRANSFERS ({transfers.length + nft_transfers.length})</h2>
      <div class="tx-transfers-list">
        {transfers.map((transfer, index) => (
          <div class="tx-transfer" key={`ft-${index}`}>
            <div class="tx-transfer-line">
              {endpoint_fun(transfer.from)}
              <span class="tx-transfer-arrow">&rarr;</span>
              {endpoint_fun(transfer.to)}
            </div>
            <div class="tx-transfer-amount">
              {transfer.token_type === "near"
                ? format_near_with_unit(transfer.amount)
                : transfer.amount}
              {transfer.contract_id !== undefined && (
                <code class="tx-transfer-contract">
                  {transfer.contract_id}
                </code>
              )}
            </div>
            {transfer.memo !== undefined && transfer.memo.length > 0 && (
              <div class="tx-transfer-memo">{transfer.memo}</div>
            )}
          </div>
        ))}
        {nft_transfers.map((transfer, index) => (
          <div class="tx-transfer" key={`nft-${index}`}>
            <div class="tx-transfer-line">
              {endpoint_fun(transfer.from)}
              <span class="tx-transfer-arrow">&rarr;</span>
              {endpoint_fun(transfer.to)}
            </div>
            <div class="tx-transfer-amount">
              <code>{transfer.token_id}</code>
              <code class="tx-transfer-contract">{transfer.contract_id}</code>
            </div>
            {transfer.memo !== undefined && transfer.memo.length > 0 && (
              <div class="tx-transfer-memo">{transfer.memo}</div>
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
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TX_TRANSFERS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_TX_TRANSFERS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
