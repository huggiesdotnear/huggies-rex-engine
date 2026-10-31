// ========================================
// the indexed holders table on the token page: the rank, the account, the
// balance and the usd value, paged by cursor.
//
// it reads the loaded holders from the page's store. it fetches nothing —
// the next page is asked for when the reader nears the bottom of the list.
import { render } from "preact";
import { useRef as use_ref } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKEN_PAGE_TOKEN_STATE } from "../ts/token_page_token_state";
import { HUGGIES_TOKEN_PAGE_TOKEN } from "../ts/token_page_token";
import { token_holder_row_fun } from "./shared/token_holder_row";
import { use_page_store_fun } from "../ts/use_page_store";
import { use_scroll_load_fun } from "../ts/use_scroll_load";
import type { HUGGIES_TOKEN_DETAIL } from "../ts/token_page_token_detail";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_TOKEN_HOLDERS_FUN() {
  const state = use_page_store_fun(HUGGIES_TOKEN_PAGE_TOKEN_STATE);
  const detail = state.detail;
  // the scroll box, so the reader's position at the bottom is
  // detectable.
  const scroll_ref = use_ref<HTMLDivElement | null>(null);
  // ask the loader for the next holder page and fold it into the store.
  const load_more_fun = () => {
    const token_id = HUGGIES_TOKEN_PAGE_TOKEN_STATE.get_token_id();
    const cursor = state.next_cursor;
    if (token_id === null || cursor === null || state.loading_more) return;
    HUGGIES_TOKEN_PAGE_TOKEN_STATE.set({
      ...state,
      loading_more: true,
    });
    void HUGGIES_TOKEN_PAGE_TOKEN.load_holders(token_id, cursor)
      .then((page) => {
        const current = HUGGIES_TOKEN_PAGE_TOKEN_STATE.get();
        HUGGIES_TOKEN_PAGE_TOKEN_STATE.set({
          ...current,
          holders: [...current.holders, ...page.rows],
          holder_total: page.total,
          next_cursor: page.next_cursor,
          loading_more: false,
        });
      })
      .catch((err: unknown) => {
        const current = HUGGIES_TOKEN_PAGE_TOKEN_STATE.get();
        HUGGIES_TOKEN_PAGE_TOKEN_STATE.set({
          ...current,
          loading_more: false,
          error: err instanceof Error ? err.message : String(err),
        });
      });
  };

  // --- WHY THE NEXT PAGE IS ASKED FOR ON SCROLL: the reader scrolls
  // the list and the next page is already on its way by the time they
  // reach the bottom. this is what the discover page's token list does,
  // and a button in the middle of the list was the one thing the app
  // did differently from itself.
  use_scroll_load_fun(
    scroll_ref,
    state.next_cursor !== null,
    state.loading_more,
    load_more_fun,
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
function holder_info_fun(detail: HUGGIES_TOKEN_DETAIL): {
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
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TOKEN_HOLDERS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_TOKEN_HOLDERS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
