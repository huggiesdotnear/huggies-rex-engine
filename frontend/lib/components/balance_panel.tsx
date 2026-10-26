// ========================================
// the shared balance table used by every page that shows token balances.
// ========================================
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_TOKEN_INFO } from "../ts/token_info";
import { HUGGIES_AMOUNT_FORMAT } from "../ts/token_amount_format";
import { huggies_balance_row_fun } from "./balance_row";
import { api_intear_balances_get } from "../../../middleman";
// ========================================
export interface HUGGIES_BALANCE_PANEL_PROPS {
  account_id: string;
  title: string;
  sources?: ReadonlyArray<"direct" | "native">;
  empty_text?: string;
}
// ========================================
// fetch one account's balances and their token metadata.
async function fetch_panel_balances_fun(
  account_id: string,
  sources: ReadonlyArray<"direct" | "native">,
): Promise<
  ReadonlyArray<{
    id: string;
    raw: string;
    info: HUGGIES_TOKEN_INFO;
    usd_value: number;
  }>
> {
  const response = await api_intear_balances_get({
    account: account_id,
    sources,
  });
  const nonzero = response.balances.rows.filter((row) => row[2] !== "0");
  const info_map = await HUGGIES_TOKEN_INFO.get(nonzero.map((row) => row[0]));
  const entries: Array<{
    id: string;
    raw: string;
    info: HUGGIES_TOKEN_INFO;
    usd_value: number;
  }> = [];
  for (const row of nonzero) {
    const info = info_map.get(row[0]);
    if (info === undefined) continue;
    entries.push({
      id: row[0],
      raw: row[2],
      info,
      usd_value: HUGGIES_AMOUNT_FORMAT.balance_usd(row[2], info),
    });
  }
  entries.sort((a, b) => b.usd_value - a.usd_value);
  return entries;
}
// ========================================
// render the balance table for one account.
export function huggies_balance_panel_fun(
  props: HUGGIES_BALANCE_PANEL_PROPS,
): preact.JSX.Element {
  const sources = props.sources ?? ["direct", "native"];
  const [entries, set_entries] = use_state<
    ReadonlyArray<{
      id: string;
      raw: string;
      info: HUGGIES_TOKEN_INFO;
      usd_value: number;
    }> | null
  >(null);
  const [error, set_error] = use_state<string | null>(null);

  use_effect(() => {
    let cancelled = false;
    set_error(null);
    void fetch_panel_balances_fun(props.account_id, sources)
      .then((rows) => {
        if (!cancelled) set_entries(rows);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        set_entries(null);
        set_error(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [props.account_id]);

  const total_usd = (entries ?? []).reduce(
    (sum, entry) => sum + entry.usd_value,
    0,
  );

  return (
    <section class="huggies-balance-panel">
      <h2 class="huggies-section-title">{props.title}</h2>
      {error !== null ? (
        <p>{error}</p>
      ) : entries === null ? (
        <p>LOADING BALANCES...</p>
      ) : entries.length === 0 ? (
        <p>{props.empty_text ?? "NO BALANCES"}</p>
      ) : (
        <>
          <div class="huggies-scroll">
            <table>
              <tbody>
                {entries.map((entry) =>
                  huggies_balance_row_fun({
                    id: entry.id,
                    raw: entry.raw,
                    info: entry.info,
                    usd_value: entry.usd_value,
                  }),
                )}
              </tbody>
            </table>
          </div>
          <tfoot>
            <tr>
              <th>
                TOTAL
                <span class="huggies-total-usd">
                  {HUGGIES_AMOUNT_FORMAT.usd(total_usd)}
                </span>
              </th>
            </tr>
          </tfoot>
        </>
      )}
    </section>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
