// ========================================
// the shared balance table: every page that shows token balances shows
// it through this.
//
// one table, so an account and a dao read the same way. the account
// page and the dao page each have their own loader and their own
// store, so this component takes the rows as a prop and fetches
// nothing — it never reads a store.
//
// what it owns, so no page has to copy it:
//   - the nesting: the table block holds the scroll box, and the scroll
//     box holds the table. the css only caps the scroll box under that
//     nesting, so a page that hand-copies the markup wrong loses the
//     height cap.
//   - the pinned native NEAR row.
//   - the total row.
//   - the sort control.
//   - the dust toggle.
import { useState as use_state } from "preact/hooks";
import { ArrowDown, ArrowUp } from "lucide-preact";
import { HUGGIES_AMOUNT_FORMAT } from "../ts/token_amount_format";
import { HUGGIES_BALANCE_FILTER } from "../ts/balance_filter";
import { HUGGIES_BALANCE_SORT } from "../ts/balance_sort";
import { huggies_balance_row_fun } from "./balance_row";
import type { HUGGIES_BALANCE_ENTRY } from "../ts/balance_filter";
import type { HUGGIES_BALANCE_SORT_BY } from "../ts/balance_sort";
// ========================================
// --- CONFIG -----------------------------
// the native NEAR row is pinned above the sorted list: it is the gas
// balance an account cannot function without, so it is not competing
// for rank with the rest.
const HUGGIES_NEAR_ID = "near";
// the default order: biggest position first, which is what a reader
// opening an account wants to see.
const HUGGIES_DEFAULT_SORT_BY: HUGGIES_BALANCE_SORT_BY = "usd";
const HUGGIES_DEFAULT_SORT_DESC = true;
// ========================================
// --- PROPS ------------------------------
export interface HUGGIES_BALANCE_TABLE_PROPS {
  // the holdings to show, already carrying their token metadata.
  rows: ReadonlyArray<HUGGIES_BALANCE_ENTRY>;
  // the heading above the table. null for no heading.
  title?: string | null;
  // shown while the page is still loading.
  loading?: boolean;
  // shown when there is nothing to show and nothing is hidden.
  empty_text?: string;
  // the account the rows belong to. it goes on the table as a data
  // attribute, so a reader can tell whose table it is in the markup.
  account_id?: string | null;
}
// ========================================
// --- SORT CONTROL ----------------------
// the two sort keys as a toggle above the table, plus a direction
// button. one control for both rather than clickable column headers,
// because with a single stacked column there is no header row to hang
// them on.
function sort_toggle_fun(
  sort_by: HUGGIES_BALANCE_SORT_BY,
  sort_desc: boolean,
  on_sort: (by: HUGGIES_BALANCE_SORT_BY) => void,
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
// --- DUST TOGGLE -----------------------
// the reader's switch for the dust, below the table.
//
// --- WHY --- a control and not a fixed rule: whether a $0.04 holding
// matters depends on who is asking. a busy account wants the table
// short, a dao auditing its treasury wants the truth. both are one
// click apart, and neither is the wrong answer.
//
// --- WHY --- the count sits above the button, not beside it. the
// button says what it does — SHOW DUST — and the count above it says
// what the click will bring in, so the reader reads "12 low-value
// holdings hidden" and then "SHOW DUST" and knows the button is the
// thing that uncovers them.
function dust_toggle_fun(
  show_dust: boolean,
  hidden_count: number,
  on_toggle: () => void,
): preact.JSX.Element {
  if (show_dust) {
    return (
      <div class="huggies-dust" role="group" aria-label="dust holdings">
        <button type="button" class="huggies-dust-button" onClick={on_toggle}>
          HIDE DUST
        </button>
      </div>
    );
  }
  return (
    <div class="huggies-dust" role="group" aria-label="dust holdings">
      {hidden_count > 0 && (
        <span class="huggies-dust-note">
          {hidden_count} low-value holding{hidden_count === 1 ? "" : "s"} hidden
        </span>
      )}
      <button type="button" class="huggies-dust-button" onClick={on_toggle}>
        SHOW DUST
      </button>
    </div>
  );
}
// ========================================
// --- COMPONENT --------------------------
export function huggies_balance_table_fun(
  props: HUGGIES_BALANCE_TABLE_PROPS,
): preact.JSX.Element {
  const [sort_by, set_sort_by] = use_state<HUGGIES_BALANCE_SORT_BY>(
    HUGGIES_DEFAULT_SORT_BY,
  );
  const [sort_desc, set_sort_desc] = use_state(HUGGIES_DEFAULT_SORT_DESC);
  // the dust is hidden until the reader asks for it, on every page.
  const [show_dust, set_show_dust] = use_state(false);

  // clicking the active key flips direction; clicking a new key
  // switches to it and starts descending, the useful default for both.
  const on_sort_fun = (by: HUGGIES_BALANCE_SORT_BY) => {
    if (by === sort_by) {
      set_sort_desc(!sort_desc);
      return;
    }
    set_sort_by(by);
    set_sort_desc(true);
  };

  const all_rows = props.rows;
  // the native NEAR holding is pulled out of the sortable list and
  // pinned above it; everything else competes on usd or ticker.
  const near_entry = all_rows.find((entry) => entry.id === HUGGIES_NEAR_ID);
  const rest = all_rows.filter((entry) => entry.id !== HUGGIES_NEAR_ID);
  // the filter hides dust and spam. it runs here so the hidden count is
  // known for the toggle.
  const kept = HUGGIES_BALANCE_FILTER.filter(rest, show_dust);
  const hidden_count = HUGGIES_BALANCE_FILTER.hidden_count(rest, show_dust);
  const sorted = HUGGIES_BALANCE_SORT.sort(kept, sort_by, sort_desc);
  // the total covers the pinned row too, so it is not counted twice.
  const total_usd = all_rows.reduce((sum, entry) => sum + entry.usd_value, 0);

  const is_loading = props.loading === true;

  return (
    <>
      {props.title !== null && props.title !== undefined && (
        <h2 class="huggies-section-title">{props.title}</h2>
      )}
      <div class="huggies-balance-table">
        {sort_toggle_fun(sort_by, sort_desc, on_sort_fun)}
        {/* the scroll box caps the height so a long token list never
            pushes the rest of the page off screen. */}
        <div class="huggies-scroll">
          <table data-huggies-balance-account={props.account_id ?? undefined}>
            <tbody>
              {is_loading && (
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
              {!is_loading &&
                sorted.length === 0 &&
                near_entry === undefined && (
                  <tr>
                    <td>
                      {show_dust
                        ? (props.empty_text ?? "NO BALANCES")
                        : `NO BALANCES OVER ${HUGGIES_BALANCE_FILTER.min_usd} USD`}
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
        {dust_toggle_fun(show_dust, hidden_count, () =>
          set_show_dust(!show_dust),
        )}
      </div>
    </>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
