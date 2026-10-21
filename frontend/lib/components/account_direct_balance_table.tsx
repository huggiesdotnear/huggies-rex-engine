// ========================================
// <table> of an account's direct token balances from the intear api.
// reads the `?id=` url parameter through lib/ts/account_id.ts, joins
// token metadata through lib/ts/token_info.ts (indexeddb-cached),
// filters through balance_filter.ts and sorts through balance_sort.ts.
// amounts are rendered human-readable via token_amount_format.ts.
// mounts into <div id="HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE">.
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
// why only "direct": intear splits an account's holdings across three
// sources — "direct" tokens the account holds itself, "native" ones
// tracked another way, and "rhea" LP positions. this table is the
// direct balance only; a later component covering the rest is the
// place to add the other two sources.
const HUGGIES_DIRECT_BALANCE_SOURCES = ["direct"] as const;
// the default order: biggest position first, which is what a reader
// opening their own account wants to see.
const HUGGIES_DEFAULT_SORT_BY: HUGGIES_SORT_BY = "usd";
const HUGGIES_DEFAULT_SORT_DESC = true;
// ========================================
// ========================================
// --- FETCH -----------------------------
// pull direct balances, attach metadata, apply the filter, and hand
// back the entries the table renders plus how many were hidden.
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
    sources: HUGGIES_DIRECT_BALANCE_SOURCES,
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
// --- SORT HEADER ------------------------
// a clickable column header that shows the current direction.
function sort_header_fun(
  label: string,
  by: HUGGIES_SORT_BY,
  current: HUGGIES_SORT_BY,
  desc: boolean,
  on_sort: (by: HUGGIES_SORT_BY) => void,
): preact.JSX.Element {
  const active = current === by;
  const Icon = desc ? ArrowDown : ArrowUp;
  return (
    <th scope="col" data-huggies-sort={by} class={active ? "is-active" : ""}>
      <button
        type="button"
        onClick={() => on_sort(by)}
        aria-label={`sort by ${label}`}
        title={`sort by ${label}`}
      >
        {label}
        {/* an inactive column shows a faint arrow so the control is discoverable */}
        {active ? <Icon size={12} /> : <Icon size={12} class="is-idle" />}
      </button>
    </th>
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

  // clicking the active column flips direction; clicking a new column
  // switches to it and starts descending, which is the useful default
  // for both keys.
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

  const sorted =
    entries === null
      ? []
      : HUGGIES_BALANCE_SORT.sort(entries, sort_by, sort_desc);
  const total_usd = sorted.reduce((sum, entry) => sum + entry.usd_value, 0);

  return (
    <>
      {/* the scroll box caps the height so a long token list never
          pushes the rest of the page off screen. */}
      <div class="huggies-scroll">
        <table data-huggies-account={account_id}>
        <thead>
          <tr>
            {sort_header_fun(
              "TOKEN",
              "symbol",
              sort_by,
              sort_desc,
              on_sort_fun,
            )}
            <th scope="col" class="huggies-numeric">BALANCE</th>
            {sort_header_fun("USD", "usd", sort_by, sort_desc, on_sort_fun)}
          </tr>
        </thead>
        <tbody>
          {entries === null && error === null && (
            <tr>
              <td colSpan={3}>LOADING...</td>
            </tr>
          )}
          {sorted.map((entry) => (
            // --- WHY --- keyed by token id, not symbol: symbols are not
            // unique (two different tokens can share one).
            <tr key={entry.id}>
              <td>
                <span class="huggies-token-cell">
                  {token_icon_fun(entry.info.icon, entry.info.symbol)}
                  <span class="huggies-ticker">{entry.info.symbol}</span>
                  {/* the full contract id, so a row is always copyable
                      back to a block explorer */}
                  <span class="huggies-contract" title={entry.id}>
                    {entry.id}
                  </span>
                </span>
              </td>
              <td class="huggies-numeric">
                {HUGGIES_AMOUNT_FORMAT.balance(entry.raw, entry.info)}
              </td>
              <td class="huggies-numeric">
                {HUGGIES_AMOUNT_FORMAT.usd(entry.usd_value)}
              </td>
            </tr>
          ))}
          {entries !== null && sorted.length === 0 && (
            <tr>
              <td colSpan={3}>NO DIRECT BALANCES OVER {HUGGIES_BALANCE_FILTER.min_usd} USD</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">TOTAL</th>
            <td />
            <td class="huggies-numeric">
              {HUGGIES_AMOUNT_FORMAT.usd(total_usd)}
            </td>
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