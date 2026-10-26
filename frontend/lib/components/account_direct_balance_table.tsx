// ========================================
// <table> of an account's token balances from the intear api.
//
// this component does NOT fetch. the account page has one loader
// (lib/ts/app_page_account.ts) and this component reads its result from the
// page store (lib/ts/app_page_account_store.ts). read that file to see what
// the account page requests.
//
// reads the `?id=` url parameter through lib/ts/app_page_account_id.ts,
// filters through app_page_account_balance_filter.ts and sorts through
// app_page_account_balance_sort.ts. amounts are rendered
// human-readable via token_amount_format.ts. one row per token, each
// field stacked in a single column so the table never needs horizontal
// scrolling. mounts into
// <div id="HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE">.
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { ArrowDown, ArrowUp } from "lucide-preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_APP_PAGE_ACCOUNT_ID } from "../ts/app_page_account_id";
import { HUGGIES_APP_PAGE_ACCOUNT_STORE } from "../ts/app_page_account_store";
import { HUGGIES_AMOUNT_FORMAT } from "../ts/token_amount_format";
import { HUGGIES_APP_PAGE_ACCOUNT_BALANCE_FILTER } from "../ts/app_page_account_balance_filter";
import { HUGGIES_APP_PAGE_ACCOUNT_BALANCE_SORT } from "../ts/app_page_account_balance_sort";
import { huggies_balance_row_fun } from "../ts/balance_row";
import type { HUGGIES_APP_PAGE_ACCOUNT_BALANCE_ENTRY } from "../ts/app_page_account_balance_filter";
import type { HUGGIES_APP_PAGE_ACCOUNT_SORT_BY } from "../ts/app_page_account_balance_sort";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the native NEAR row is pinned above the sorted list: it is the gas
// balance an account cannot function without, so it is not competing
// for rank with the rest.
const HUGGIES_NEAR_ID = "near";
// the default order: biggest position first, which is what a reader
// opening their own account wants to see.
const HUGGIES_DEFAULT_SORT_BY: HUGGIES_APP_PAGE_ACCOUNT_SORT_BY = "usd";
const HUGGIES_DEFAULT_SORT_DESC = true;
// ========================================
// ========================================
// ========================================
// --- SORT CONTROL ----------------------
// the two sort keys as a toggle above the table, plus a direction
// button. one control for both rather than clickable column headers,
// because with a single stacked column there is no header row to hang
// them on.
function sort_toggle_fun(
  sort_by: HUGGIES_APP_PAGE_ACCOUNT_SORT_BY,
  sort_desc: boolean,
  on_sort: (by: HUGGIES_APP_PAGE_ACCOUNT_SORT_BY) => void,
): preact.JSX.Element {
  const Icon = sort_desc ? ArrowDown : ArrowUp;
  return (
    <div class="huggies-sort" role="group" aria-label="sort balances">
      <button
        type="button"
        class={sort_by === "usd" ? "is-active" : ""}
        aria-pressed={sort_by === "usd"}
        onClick={() => on_sort("usd")}
      >
        USD
      </button>
      <button
        type="button"
        class={sort_by === "symbol" ? "is-active" : ""}
        aria-pressed={sort_by === "symbol"}
        onClick={() => on_sort("symbol")}
      >
        TICKER
      </button>
      <button
        type="button"
        class="huggies-sort-dir"
        onClick={() => on_sort(sort_by)}
        aria-label={sort_desc ? "sort ascending" : "sort descending"}
        title={sort_desc ? "descending" : "ascending"}
      >
        <Icon size={14} />
        {sort_desc ? "DESC" : "ASC"}
      </button>
    </div>
  );
}
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE_FUN() {
  // ========================================
  const [, set_revision] = use_state(0);
  const [sort_by, set_sort_by] = use_state<HUGGIES_APP_PAGE_ACCOUNT_SORT_BY>(
    HUGGIES_DEFAULT_SORT_BY,
  );
  const [sort_desc, set_sort_desc] = use_state(HUGGIES_DEFAULT_SORT_DESC);

  const account_id = HUGGIES_APP_PAGE_ACCOUNT_ID.get_account_id();

  // the page store owns the load. this component starts it once and
  // re-renders when it lands.
  use_effect(() => {
    if (account_id === null) return;
    const unsubscribe = HUGGIES_APP_PAGE_ACCOUNT_STORE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    void HUGGIES_APP_PAGE_ACCOUNT_STORE.load(account_id);
    return unsubscribe;
  }, [account_id]);

  // clicking the active key flips direction; clicking a new key
  // switches to it and starts descending, the useful default for both.
  const on_sort_fun = (by: HUGGIES_APP_PAGE_ACCOUNT_SORT_BY) => {
    if (by === sort_by) {
      set_sort_desc(!sort_desc);
      return;
    }
    set_sort_by(by);
    set_sort_desc(true);
  };

  // no `?id=` on this url — render nothing.
  if (account_id === null) return <></>;

  const page_data = HUGGIES_APP_PAGE_ACCOUNT_STORE.get_data();

  // the native NEAR holding is pulled out of the sortable list and
  // pinned above it; everything else competes on usd or ticker.
  const all_entries: Array<HUGGIES_APP_PAGE_ACCOUNT_BALANCE_ENTRY> = (page_data?.direct ?? []).map(
    (balance) => ({
      id: balance.id,
      raw: balance.raw,
      usd_value: balance.usd_value,
      info: balance.info,
    }),
  );
  const near_entry = all_entries.find((entry) => entry.id === HUGGIES_NEAR_ID);
  const rest = all_entries.filter((entry) => entry.id !== HUGGIES_NEAR_ID);
  // the balance filter hides dust and spam. it runs here so the hidden
  // count is known for the note under the table.
  const kept = HUGGIES_APP_PAGE_ACCOUNT_BALANCE_FILTER.filter(rest);
  const hidden_count = rest.length - kept.length;
  const sorted = HUGGIES_APP_PAGE_ACCOUNT_BALANCE_SORT.sort(kept, sort_by, sort_desc);
  // the total covers the pinned row too, so it is not counted twice.
  const total_usd = all_entries.reduce(
    (sum, entry) => sum + entry.usd_value,
    0,
  );

  return (
    <>
      {sort_toggle_fun(sort_by, sort_desc, on_sort_fun)}
      {/* the scroll box caps the height so a long token list never
          pushes the rest of the page off screen. */}
      <div class="huggies-scroll">
        <table data-huggies-account={account_id}>
          <tbody>
            {page_data === null && (
              <tr>
                <td>LOADING...</td>
              </tr>
            )}
            {near_entry !== undefined &&
              huggies_balance_row_fun({
                id: near_entry.id,
                raw: near_entry.raw,
                info: near_entry.info,
                usd_value: near_entry.usd_value,
                pinned: true,
              })}
            {sorted.map((entry) =>
              huggies_balance_row_fun({
                id: entry.id,
                raw: entry.raw,
                info: entry.info,
                usd_value: entry.usd_value,
              }),
            )}
            {page_data !== null &&
              sorted.length === 0 &&
              near_entry === undefined && (
                <tr>
                  <td>
                    NO BALANCES OVER {HUGGIES_APP_PAGE_ACCOUNT_BALANCE_FILTER.min_usd} USD
                  </td>
                </tr>
              )}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">
                TOTAL
                <span class="huggies-total-usd">
                  {HUGGIES_AMOUNT_FORMAT.usd(total_usd)}
                </span>
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
      {hidden_count > 0 && (
        <p class="huggies-hidden-note">
          {hidden_count} low-value holding{hidden_count === 1 ? "" : "s"} hidden
        </p>
      )}
    </>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    HUGGIES_APP_PAGE_ACCOUNT_ID.init();
    render(<HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
