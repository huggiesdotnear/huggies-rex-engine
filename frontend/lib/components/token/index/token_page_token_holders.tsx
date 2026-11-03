// ========================================
// the indexed holders table on the token page: the rank, the account, the
// balance, the usd value and the share of the total supply, paged by
// cursor.
//
// it reads the loaded holders from the page's store. it fetches nothing —
// the next page is asked for when the reader nears the bottom of the list.
import { render } from "preact";
import { useRef as use_ref } from "preact/hooks";
import { SHIT_1170_MOUNT_ID } from "../../../ts/shared/mount_ids";
import { SHIT_1170_TOKEN_PAGE_TOKEN_STATE } from "../../../ts/token/index/token_page_token_state";
import { token_holder_row_fun } from "./token_holder_row";
import { use_page_store_fun } from "../../../ts/shared/use_page_store";
import { use_scroll_load_fun } from "../../../ts/shared/use_scroll_load";
import type { SHIT_1170_TOKEN_DETAIL } from "../../../ts/token/index/token_page_token_types";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the css selector that matches ONE row of the holders table. the scroll
// hook is told what a row is, so it can count the rows that have landed.
const SHIT_1170_TOKEN_HOLDERS_ROW_SELECTOR = "tr";
// ========================================
// --- COMPONENT --------------------------
function SHIT_1170_COMPONENT_TOKEN_HOLDERS_FUN() {
  const state = use_page_store_fun(SHIT_1170_TOKEN_PAGE_TOKEN_STATE);
  const detail = state.detail;
  // the scroll box, so the reader's position at the bottom is
  // detectable.
  const scroll_ref = use_ref<HTMLDivElement | null>(null);
  // --- WHY THE NEXT PAGE IS ASKED FOR ON SCROLL: the reader scrolls
  // the list and the next page is already on its way by the time they
  // reach the bottom. this is what the discover page's token list does,
  // and a button in the middle of the list was the one thing the app
  // did differently from itself.
  use_scroll_load_fun(
    scroll_ref,
    state.next_cursor !== null,
    state.loading_more,
    // --- WHY THE PAGE ASKS ITS STORE FOR THE NEXT PAGE: the store holds
    // the cursor and the rows, so it is the only place that knows where
    // the next page starts. the component just says WHEN.
    () => {
      void SHIT_1170_TOKEN_PAGE_TOKEN_STATE.load_more();
    },
    // the rows are table rows.
    SHIT_1170_TOKEN_HOLDERS_ROW_SELECTOR,
  );

  // --- WHY THE CHECK IS HERE AND NOT AT THE TOP: a hook cannot be
  // skipped — the number of hooks a component runs has to be the same
  // every time it renders, or preact cannot keep the two renders in
  // step. so the early return comes after the hook.
  if (detail === null) return null;

  return (
    <section class="token-holders">
      <h2>INDEXED HOLDERS ({state.holder_total.toLocaleString()})</h2>
      <div class="scroll" ref={scroll_ref}>
        <table>
          <thead>
            <tr>
              <th class="holder-rank">#</th>
              <th class="holder-account">ACCOUNT</th>
              <th class="holder-amount">BALANCE</th>
              <th class="holder-usd">USD</th>
              <th class="holder-percent">% SUPPLY</th>
            </tr>
          </thead>
          <tbody>
            {state.holders.map((holder, index) =>
              token_holder_row_fun({
                key: holder.account_id,
                rank: index + 1,
                account_id: holder.account_id,
                balance: holder.balance,
                info: holder_info_fun(detail),
                total_supply_raw: detail.total_supply_raw,
              }),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
// ========================================
// --- HELPERS ----------------------------
// the token info the holder rows price their balances with.
//
// --- WHY --- the metadata record already carries the price and the
// decimals, so the rows price themselves from it and no second request is
// needed.
function holder_info_fun(detail: SHIT_1170_TOKEN_DETAIL): {
  id: string;
  symbol: string;
  decimals: number;
  icon: string | null;
  price_usd: number;
  reputation: string;
  holders: number;
} {
  return {
    id: detail.id,
    symbol: detail.symbol,
    decimals: detail.decimals,
    icon: detail.icon,
    price_usd: detail.price_usd,
    reputation: detail.reputation,
    holders: detail.holders,
  };
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_TOKEN_HOLDERS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_TOKEN_HOLDERS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
