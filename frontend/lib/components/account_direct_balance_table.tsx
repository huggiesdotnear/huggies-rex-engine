// ========================================
// <table> of an account's direct token balances from the intear api.
// reads the `?id=` url parameter through lib/ts/account_id.ts and
// renders nothing when there is none. mounts into
// <div id="HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE">.
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_ACCOUNT_ID } from "../ts/account_id";
import { api_intear_balances_get } from "../../../middleman";
import type { balances_get_response } from "@sleet-js/intear-api-tool-box";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// why only "direct": intear splits an account's holdings across three
// sources — "direct" tokens the account holds itself, "native" ones
// tracked another way, and "rhea" LP positions. this table is the
// direct balance only; a later component covering the rest is the
// place to add the other two sources.
const HUGGIES_DIRECT_BALANCE_SOURCES = ["direct"] as const;
// the token field to request so we can show a symbol instead of a
// contract id. the value comes back in the response's separate
// `tokens` table, not in the balance rows — see join_symbols_fun.
const HUGGIES_BALANCE_TOKEN_FIELDS = ["symbol"] as const;
// ========================================
// ========================================
// --- TYPES ------------------------------
// one rendered row: [display_name, balance]. display_name is the
// token symbol when the api knows one, else the raw token id.
type HUGGIES_BALANCE_ROW = readonly [string, string];
// ========================================
// ========================================
// --- HELPERS ----------------------------
// map token id -> symbol from the response's `tokens` table, whose
// rows are [account_id, symbol]. the balance rows themselves only
// ever carry the raw token id, so the symbol has to be joined in here.
// --- WHY --- typed off the sdk's own `tokens` shape rather than the
// narrow literal ["account_id","symbol"]: the generic infers the whole
// token_requested_field union, so the row's second slot stays `unknown`
// and gets checked as a string below.
function join_symbols_fun(
  tokens: balances_get_response["tokens"],
): Map<string, string> {
  const symbols = new Map<string, string>();
  if (tokens === undefined) return symbols;
  for (const row of tokens.rows) {
    const [account_id, symbol] = row;
    if (typeof symbol === "string" && symbol.length > 0) {
      symbols.set(account_id, symbol);
    }
  }
  return symbols;
}
// ========================================
// keep only rows holding a real amount.
// --- WHY --- the api returns every token the account has ever held,
// including hundreds of dust positions left at exactly 0 — an
// unfiltered table is mostly noise. "0" is the only zero the api
// emits for a balance, so a plain string compare is enough.
function drop_empty_rows_fun(
  rows: ReadonlyArray<HUGGIES_BALANCE_ROW>,
): ReadonlyArray<HUGGIES_BALANCE_ROW> {
  return rows.filter((row) => row[1] !== "0");
}
// ========================================
// ========================================
// ----------------------------------------
// the two setters the fetch writes through. passed in rather than
// closed over because the hook state lives in the component and this
// helper is defined outside it.
// ----------------------------------------
interface HUGGIES_BALANCE_SINKS {
  set_rows: (rows: ReadonlyArray<HUGGIES_BALANCE_ROW>) => void;
  set_error: (message: string | null) => void;
}
// ========================================
// ----------------------------------------
// pull the direct balances for one account and store them for render.
async function fetch_direct_balances_fun(
  account_id: string,
  sinks: HUGGIES_BALANCE_SINKS,
): Promise<void> {
  sinks.set_error(null);
  try {
    const response = await api_intear_balances_get({
      account: account_id,
      sources: HUGGIES_DIRECT_BALANCE_SOURCES,
      token_fields: HUGGIES_BALANCE_TOKEN_FIELDS,
    });
    const symbols = join_symbols_fun(response.tokens);
    const joined: Array<HUGGIES_BALANCE_ROW> = response.balances.rows.map(
      (row) => [symbols.get(row[0]) ?? row[0], row[2]],
    );
    sinks.set_rows(drop_empty_rows_fun(joined));
    // --- WHY --- errors are per-source, not a failed request: the
    // call succeeded for the sources that answered, so surface them
    // beside the table instead of discarding good rows.
    const failures = Object.entries(response.errors ?? {});
    if (failures.length > 0) {
      sinks.set_error(
        failures.map(([source, e]) => `${source}: ${e.message}`).join(" · "),
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    sinks.set_rows([]);
    sinks.set_error(message);
    console.warn("[account_direct_balance_table] balances fetch failed", err);
  }
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE_FUN() {
  // ========================================
  // null = not fetched yet; an empty array = fetched, nothing held.
  const [rows, set_rows] = use_state<ReadonlyArray<HUGGIES_BALANCE_ROW> | null>(
    null,
  );
  // a message shown beside the table, never replacing it.
  const [error, set_error] = use_state<string | null>(null);
  const account_id = HUGGIES_ACCOUNT_ID.get_account_id();

  // refetch whenever the page's account id changes (including to
  // null, which drops the old rows).
  use_effect(() => {
    if (account_id === null) {
      set_rows(null);
      set_error(null);
      return;
    }
    void fetch_direct_balances_fun(account_id, { set_rows, set_error });
  }, [account_id]);

  // no `?id=` on this url — render nothing.
  if (account_id === null) return <></>;

  return (
    <>
      <table data-huggies-account={account_id}>
        <thead>
          <tr>
            <th scope="col">TOKEN</th>
            <th scope="col">BALANCE</th>
          </tr>
        </thead>
        <tbody>
          {rows === null && error === null && (
            <tr>
              <td colSpan={2}>LOADING...</td>
            </tr>
          )}
          {rows?.map((row, index) => (
            // --- WHY --- keyed by index, not the display name:
            // symbols are not unique (two different tokens can share
            // one), and the raw token id is no longer in the row after
            // the join.
            <tr key={index}>
              <td>{row[0]}</td>
              <td>{row[1]}</td>
            </tr>
          ))}
          {rows !== null && rows.length === 0 && (
            <tr>
              <td colSpan={2}>NO DIRECT BALANCES</td>
            </tr>
          )}
        </tbody>
      </table>
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