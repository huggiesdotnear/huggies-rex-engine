// ========================================
// <table> of an account's token balances from the intear api.
// reads the `?id=` url parameter through lib/ts/account_id.ts, joins
// token metadata through lib/ts/token_info.ts (indexeddb-cached),
// filters through balance_filter.ts and sorts through balance_sort.ts.
// amounts are rendered human-readable via token_amount_format.ts.
// one row per token, each field stacked in a single column so the
// table never needs horizontal scrolling. mounts into
// <div id="HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE">.
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { ArrowDown, ArrowUp } from "lucide-preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_ACCOUNT_ID } from "../ts/account_id";
import { api_intear_balances_get } from "../../../middleman";
import { HUGGIES_TOKEN_INFO } from "../ts/token_info";
import { HUGGIES_AMOUNT_FORMAT } from "../ts/token_amount_format";
import { HUGGIES_BALANCE_FILTER } from "../ts/balance_filter";
import { HUGGIES_BALANCE_SORT } from "../ts/balance_sort";
import type { HUGGIES_BALANCE_ENTRY } from "../ts/balance_filter";
import type { HUGGIES_SORT_BY } from "../ts/balance_sort";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// "direct" is what the account holds itself; "native" is the chain's
// own NEAR balance, which intear reports as its own source. both come
// from the SAME /balances request — there is no separate endpoint for
// the NEAR balance. "rhea" (LP positions) is deliberately left out; a
// later component covering LP holdings is the place to add it.
const HUGGIES_BALANCE_SOURCES = ["direct", "native"] as const;
// the native NEAR row is pinned above the sorted list: it is the gas
// balance an account cannot function without, so it is not competing
// for rank with the rest.
const HUGGIES_NEAR_ID = "near";
// the default order: biggest position first, which is what a reader
// opening their own account wants to see.
const HUGGIES_DEFAULT_SORT_BY: HUGGIES_SORT_BY = "usd";
const HUGGIES_DEFAULT_SORT_DESC = true;
// ========================================
// ========================================
// --- FETCH -----------------------------
// pull balances, attach metadata, apply the filter, and hand back the
// entries the table renders plus how many were hidden.
// --- WHY --- the hidden count is returned rather than recomputed in the
// component: only here do we know both the pre-filter and post-filter
// sizes, and the note under the table needs the difference.
async function fetch_balance_entries_fun(
  account_id: string,
): Promise<{
  entries: ReadonlyArray<HUGGIES_BALANCE_ENTRY>;
  hidden_count: number;
}> {
  const response = await api_intear_balances_get({
    account: account_id,
    sources: HUGGIES_BALANCE_SOURCES,
  });

  const rows = response.balances.rows;
  // a 0 balance means the account merely touched the token once; it is
  // not a holding and must not reach the table.
  const nonzero = rows.filter((row) => row[2] !== "0");

  const info_map = await HUGGIES_TOKEN_INFO.get(nonzero.map((row) => row[0]));

  const entries: Array<HUGGIES_BALANCE_ENTRY> = [];
  for (const row of nonzero) {
    const info = info_map.get(row[0]);
    if (info === undefined) continue;
    entries.push({
      id: row[0],
      raw: row[2],
      usd_value: HUGGIES_AMOUNT_FORMAT.balance_usd(row[2], info),
      info,
    });
  }
  const kept = HUGGIES_BALANCE_FILTER.filter(entries);
  return { entries: kept, hidden_count: entries.length - kept.length };
}
// ========================================
// ========================================
// --- ICON ------------------------------
// the token's icon when it has one, else a neutral dot so every row
// keeps the same alignment.
// --- WHY --- <img> with the api's data: url directly: the icon field is
// already a self-contained data uri, so there is no extra request and
// no origin problem to configure.
function token_icon_fun(
  icon: string | null,
  symbol: string,
): preact.JSX.Element {
  if (icon === null) {
    return <span class="huggies-token-icon huggies-token-icon--empty" aria-hidden="true" />;
  }
  return (
    <img
      class="huggies-token-icon"
      src={icon}
      alt=""
      width={20}
      height={20}
      loading="lazy"
      title={symbol}
    />
  );
}
// ========================================
// ========================================
// ========================================
// --- ROW -------------------------------
// one token with every field stacked in a single cell: icon, ticker,
// balance and usd on the first line, the contract id clipped on the
// line below.
// --- WHY --- one cell rather than three columns: a full contract id
// next to a long balance made the table overflow horizontally on
// narrow screens. stacking keeps every row inside the viewport and lets
// the contract id ellipsise on its own line instead of stretching the
// whole table.
function balance_row_fun(
  entry: HUGGIES_BALANCE_ENTRY,
  pinned: boolean,
): preact.JSX.Element {
  const { info, raw, usd_value } = entry;
  return (
    // keyed by token id, not symbol: symbols are not unique (two
    // different tokens can share one).
    <tr key={entry.id} class={pinned ? "is-pinned" : undefined}>
      <td>
        <div class="huggies-row-head">
          {token_icon_fun(info.icon, info.symbol)}
          <span class="huggies-ticker">{info.symbol}</span>
          {pinned && <span class="huggies-pinned-tag">NEAR</span>}
          <span class="huggies-amounts">
            <span class="huggies-amount">
              {HUGGIES_AMOUNT_FORMAT.balance(raw, info)}
            </span>
            <span class="huggies-usd">
              {HUGGIES_AMOUNT_FORMAT.usd(usd_value)}
            </span>
          </span>
        </div>
        {/* the full contract id stays selectable and copyable, and is
            in the title so a clipped id can still be read. */}
        <div class="huggies-contract" title={entry.id}>
          {entry.id}
        </div>
      </td>
    </tr>
  );
}
// ========================================
// ========================================
// --- SORT CONTROL ----------------------
// the two sort keys as a toggle above the table, plus a direction
// button. one control for both rather than clickable column headers,
// because with a single stacked column there is no header row to hang
// them on.
function sort_toggle_fun(
  sort_by: HUGGIES_SORT_BY,
  sort_desc: boolean,
  on_sort: (by: HUGGIES_SORT_BY) => void,
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
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE_FUN() {
  // ========================================
  const [entries, set_entries] = use_state<
    ReadonlyArray<HUGGIES_BALANCE_ENTRY> | null
  >(null);
  const [error, set_error] = use_state<string | null>(null);
  const [sort_by, set_sort_by] = use_state<HUGGIES_SORT_BY>(
    HUGGIES_DEFAULT_SORT_BY,
  );
  const [sort_desc, set_sort_desc] = use_state(HUGGIES_DEFAULT_SORT_DESC);
  const [hidden_count, set_hidden_count] = use_state(0);

  const account_id = HUGGIES_ACCOUNT_ID.get_account_id();

  // refetch whenever the page's account id changes (including to null,
  // which drops the old rows).
  use_effect(() => {
    if (account_id === null) {
      set_entries(null);
      set_error(null);
      set_hidden_count(0);
      return;
    }
    let cancelled = false;
    set_error(null);
    void fetch_balance_entries_fun(account_id)
      .then((result) => {
        if (cancelled) return;
        set_entries(result.entries);
        set_hidden_count(result.hidden_count);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        set_entries(null);
        set_error(message);
        console.warn("[account_direct_balance_table] balances fetch failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, [account_id]);

  // clicking the active key flips direction; clicking a new key
  // switches to it and starts descending, the useful default for both.
  const on_sort_fun = (by: HUGGIES_SORT_BY) => {
    if (by === sort_by) {
      set_sort_desc(!sort_desc);
      return;
    }
    set_sort_by(by);
    set_sort_desc(true);
  };

  // no `?id=` on this url — render nothing.
  if (account_id === null) return <></>;

  // the native NEAR holding is pulled out of the sortable list and
  // pinned above it; everything else competes on usd or ticker.
  const all_entries = entries ?? [];
  const near_entry = all_entries.find((entry) => entry.id === HUGGIES_NEAR_ID);
  const rest = all_entries.filter((entry) => entry.id !== HUGGIES_NEAR_ID);
  const sorted = HUGGIES_BALANCE_SORT.sort(rest, sort_by, sort_desc);
  // the total covers the pinned row too, so it is not counted twice.
  const total_usd = all_entries.reduce((sum, entry) => sum + entry.usd_value, 0);

  return (
    <>
      {sort_toggle_fun(sort_by, sort_desc, on_sort_fun)}
      {/* the scroll box caps the height so a long token list never
          pushes the rest of the page off screen. */}
      <div class="huggies-scroll">
        <table data-huggies-account={account_id}>
          <tbody>
            {entries === null && error === null && (
              <tr>
                <td>LOADING...</td>
              </tr>
            )}
            {near_entry !== undefined && balance_row_fun(near_entry, true)}
            {sorted.map((entry) => balance_row_fun(entry, false))}
            {entries !== null && sorted.length === 0 && near_entry === undefined && (
              <tr>
                <td>
                  NO BALANCES OVER {HUGGIES_BALANCE_FILTER.min_usd} USD
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
      {error !== null && <p data-huggies-balance-error={error}>{error}</p>}
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
    HUGGIES_ACCOUNT_ID.init();
    render(<HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================