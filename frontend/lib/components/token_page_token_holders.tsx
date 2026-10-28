// ========================================
// the indexed holders table on the token page: the rank, the account,
// the balance and the usd value, paged by cursor.
//
// it reads the loaded holders from the page's store. it fetches nothing
// — the load more button asks the page's loader for the next page.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKEN_PAGE_TOKEN_STATE } from "../ts/token_page_token_state";
import { HUGGIES_TOKEN_PAGE_TOKEN } from "../ts/token_page_token";
import { current_app_depth_fun } from "../ts/app_depth";
import { token_holder_row_fun } from "./token_holder_row";
import { use_page_store_fun } from "../ts/use_page_store";
import type { HUGGIES_TOKEN_DETAIL } from "../ts/token_page_token_detail";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_TOKEN_HOLDERS_FUN() {
  const state = use_page_store_fun(HUGGIES_TOKEN_PAGE_TOKEN_STATE);
  const detail = state.detail;
  if (detail === null) return null;

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

  return (
    <section class="huggies-token-holders">
      <h2>INDEXED HOLDERS ({state.holder_total.toLocaleString()})</h2>
      <div class="huggies-scroll">
        <table>
          <thead>
            <tr>
              <th class="huggies-holder-rank">#</th>
              <th class="huggies-holder-account">ACCOUNT</th>
              <th class="huggies-holder-amount">BALANCE</th>
              <th class="huggies-holder-usd">USD</th>
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
      {state.next_cursor !== null && (
        <button
          type="button"
          disabled={state.loading_more}
          onClick={load_more_fun}
        >
          {state.loading_more ? "LOADING..." : "LOAD MORE"}
        </button>
      )}
    </section>
  );
}
// ========================================
// --- HELPERS ----------------------------
// the token info the holder rows price their balances with.
//
// --- WHY --- the metadata record already carries the price and the
// decimals, so the rows price themselves from it and no second request
// is needed.
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
