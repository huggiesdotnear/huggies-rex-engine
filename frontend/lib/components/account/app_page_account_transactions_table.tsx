// ========================================
// the account's transaction history table: one row per transaction,
// newest first, with the next page asked for when the reader nears the
// bottom of the list.
//
// it reads the loaded transactions from the page's transaction store.
// it fetches nothing itself — the next page is asked for through the
// store, which holds the cursor.
//
// it renders nothing when the account page is showing its balances
// tab: the tab decides what the page shows, and this table belongs to
// the transactions tab.
import { render } from "preact";
import { useRef as use_ref } from "preact/hooks";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_ACCOUNT_TX_STORE } from "../../ts/account/app_page_account_tx_store";
import { SHIT_1170_APP_PAGE_ACCOUNT_TAB_STATE } from "../../ts/account/app_page_account_tab_state";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { use_scroll_load_fun } from "../../ts/shared/use_scroll_load";
import { account_tx_row_fun } from "./app_page_account_tx_row";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the css selector that matches ONE row of the transactions table. the
// scroll hook is told what a row is, so it can count the rows that
// have landed.
const SHIT_1170_ACCOUNT_TX_ROW_SELECTOR = "tbody tr";
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_ACCOUNT_TRANSACTIONS_TABLE_FUN() {
  const tab = use_page_store_fun(SHIT_1170_APP_PAGE_ACCOUNT_TAB_STATE);
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_ACCOUNT_TX_STORE);
  // the scroll box, so the reader's position at the bottom is
  // detectable.
  const scroll_ref = use_ref<HTMLDivElement | null>(null);
  // --- WHY THE NEXT PAGE IS ASKED FOR ON SCROLL: the reader scrolls
  // the list and the next page is already on its way by the time they
  // reach the bottom. this is what the discover page's token list and
  // the token page's holders do.
  use_scroll_load_fun(
    scroll_ref,
    state.resume_token !== null,
    state.loading || state.loading_more,
    // --- WHY THE PAGE ASKS ITS STORE FOR THE NEXT PAGE: the store
    // holds the cursor, so it is the only place that knows where the
    // next page starts. the component just says WHEN.
    () => {
      void SHIT_1170_APP_PAGE_ACCOUNT_TX_STORE.load_more();
    },
    SHIT_1170_ACCOUNT_TX_ROW_SELECTOR,
  );

  // --- WHY THE CHECK IS HERE AND NOT AT THE TOP: a hook cannot be
  // skipped — the number of hooks a component runs has to be the same
  // every time it renders, or preact cannot keep the two renders in
  // step. so the early return comes after the hook.
  //
  // --- WHY THE TAB GATES THE TABLE: the account page's tab decides
  // what the page shows. the balances tables belong to the balances
  // tab and this table belongs to the transactions tab, so the reader
  // never sees both at once.
  if (tab !== "transactions") return null;

  return (
    <section class="account-transactions">
      <h2>
        TRANSACTIONS
        {state.txs_count > 0 && ` (${state.txs_count.toLocaleString()})`}
      </h2>
      {state.error !== null && <p class="tx-error">{state.error}</p>}
      <div class="scroll" ref={scroll_ref}>
        <table>
          <thead>
            <tr>
              <th class="tx-hash">TRANSACTION</th>
              <th class="tx-time">WHEN</th>
              <th class="tx-status">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {state.rows.map((row) =>
              account_tx_row_fun({
                key: row.transaction_hash,
                tx_hash: row.transaction_hash,
                timestamp: row.tx_block_timestamp,
                is_success: row.is_success,
              }),
            )}
            {state.rows.length === 0 && !state.loading && (
              <tr>
                <td colSpan={3}>NO TRANSACTIONS</td>
              </tr>
            )}
            {state.loading && state.rows.length === 0 && (
              <tr>
                <td colSpan={3}>LOADING TRANSACTIONS...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {state.loading_more && <p class="tx-loading-more">LOADING MORE...</p>}
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_ACCOUNT_TRANSACTIONS_TABLE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<SHIT_1170_COMPONENT_ACCOUNT_TRANSACTIONS_TABLE_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
