// ========================================
// the holder table on the $SHIT page: the rank, the account, the
// amount, the usd value, the share of the supply and the holder type.
//
// it reads the loaded holders from the page's store and fetches nothing
// — the load more button asks the page's loader for the next page.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKENS_PAGE_SHIT_1170_STATE } from "../ts/tokens_page_shit_1170_state";
import { HUGGIES_TOKENS_PAGE_SHIT_1170 } from "../ts/tokens_page_shit_1170";
import { current_app_depth_fun } from "../ts/app_depth";
import { use_page_store_fun } from "../ts/use_page_store";
import {
  shit_holder_icon_fun,
  shit_holder_type_label_fun,
  type HUGGIES_SHIT_HOLDER,
} from "../ts/tokens_page_shit_1170_holders";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the link to the account page of one holder.
function holder_account_href_fun(account_id: string, depth: number): string {
  const prefix = "../".repeat(Math.max(0, depth));
  return `${prefix}account.html?id=${encodeURIComponent(account_id)}`;
}
// ========================================
// render one holder row.
function render_holder_fun(
  holder: HUGGIES_SHIT_HOLDER,
  rank: number,
  depth: number,
): preact.JSX.Element {
  return (
    <tr class={`huggies-shit-holder is-${holder.type}`}>
      <td class="huggies-shit-holder-rank">{rank}</td>
      <td>
        <span class="huggies-shit-holder-type">
          {shit_holder_icon_fun(holder.type)}
        </span>
        <a
          class="huggies-shit-holder-account"
          href={holder_account_href_fun(holder.account_id, depth)}
        >
          {holder.account_id}
        </a>
      </td>
      <td class="huggies-shit-holder-amount" title={holder.balance}>
        {holder.amount_formatted}
      </td>
      <td class="huggies-shit-holder-usd">{holder.usd_formatted}</td>
      <td class="huggies-shit-holder-percent">{holder.percent_formatted}</td>
      <td>
        <span class={`huggies-shit-holder-tag is-${holder.type}`}>
          {shit_holder_type_label_fun(holder.type)}
        </span>
      </td>
    </tr>
  );
}
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_SHIT_1170_HOLDERS_FUN() {
  const state = use_page_store_fun(HUGGIES_TOKENS_PAGE_SHIT_1170_STATE);

  // ask the loader for the next holder page and fold it into the store.
  const load_more_fun = () => {
    const cursor = state.next_cursor;
    if (cursor === null || state.loading_more) return;
    const price_usd = state.price?.price_usd ?? state.summary?.price_usd ?? 0;
    HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.set({
      ...state,
      loading_more: true,
    });
    void HUGGIES_TOKENS_PAGE_SHIT_1170.load_holders(
      cursor,
      price_usd,
      state.summary?.decimals ?? 18,
      HUGGIES_TOKENS_PAGE_SHIT_1170.bigint_or_zero(
        state.summary?.total_supply_raw ?? "0",
      ),
    )
      .then((page) => {
        const current = HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.get();
        HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.set({
          ...current,
          holders: [...current.holders, ...page.rows],
          holder_total: page.total,
          next_cursor: page.next_cursor,
          loading_more: false,
        });
      })
      .catch((err: unknown) => {
        const current = HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.get();
        HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.set({
          ...current,
          loading_more: false,
          error: err instanceof Error ? err.message : String(err),
        });
      });
  };

  const filtered_holders =
    state.active_filter === "all"
      ? state.holders
      : state.holders.filter((holder) => holder.type === state.active_filter);

  return (
    <section class="huggies-shit-holders">
      <h2>
        HOLDERS (
        {state.active_filter === "all"
          ? state.holder_total
          : filtered_holders.length}
        {state.active_filter === "all" ? "" : ` OF ${state.holder_total}`})
      </h2>
      {filtered_holders.length === 0 ? (
        <p>NO HOLDERS IN THIS CATEGORY</p>
      ) : (
        <div class="huggies-shit-holders-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ACCOUNT</th>
                <th>AMOUNT</th>
                <th>USD</th>
                <th>% OF SUPPLY</th>
                <th>TYPE</th>
              </tr>
            </thead>
            <tbody>
              {filtered_holders.map((holder, index) =>
                render_holder_fun(holder, index + 1, current_app_depth_fun()),
              )}
            </tbody>
          </table>
        </div>
      )}
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
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_SHIT_1170_HOLDERS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_SHIT_1170_HOLDERS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
