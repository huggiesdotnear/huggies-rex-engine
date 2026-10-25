// ========================================
// account's Rhea DCL v2 internal token balances.
// ========================================
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_ACCOUNT_ID } from "../ts/account_id";
import { HUGGIES_TOKEN_INFO } from "../ts/token_info";
import { HUGGIES_AMOUNT_FORMAT } from "../ts/token_amount_format";
import { huggies_balance_row_fun } from "../ts/balance_row";
import { rhea_dcl_user_assets_fun } from "../ts/rhea_dcl_user_assets";
import type { HUGGIES_TOKEN_INFO as TOKEN_INFO } from "../ts/token_info";
// ========================================
interface HUGGIES_RHEA_DCL_ROW {
  id: string;
  raw: string;
  info: TOKEN_INFO;
}
// ========================================
// fetch and prepare non-zero Rhea DCL internal balances.
async function fetch_rhea_dcl_rows_fun(
  account_id: string,
): Promise<ReadonlyArray<HUGGIES_RHEA_DCL_ROW>> {
  const assets = await rhea_dcl_user_assets_fun(account_id);
  const nonzero = Object.entries(assets).filter(([, raw]) => raw !== "0");
  if (nonzero.length === 0) return [];
  const info_map = await HUGGIES_TOKEN_INFO.get(nonzero.map(([id]) => id));
  const rows: Array<HUGGIES_RHEA_DCL_ROW> = [];
  for (const [id, raw] of nonzero) {
    const info = info_map.get(id);
    if (info !== undefined) rows.push({ id, raw, info });
  }
  rows.sort(
    (a, b) =>
      HUGGIES_AMOUNT_FORMAT.balance_usd(b.raw, b.info) -
      HUGGIES_AMOUNT_FORMAT.balance_usd(a.raw, a.info),
  );
  return rows;
}
// ========================================
// render the account's Rhea DCL internal balances.
function HUGGIES_COMPONENT_ACCOUNT_RHEA_DCL_BALANCE_TABLE_FUN() {
  // ========================================
  const [rows, set_rows] =
    use_state<ReadonlyArray<HUGGIES_RHEA_DCL_ROW> | null>(null);
  const [error, set_error] = use_state<string | null>(null);
  const account_id = HUGGIES_ACCOUNT_ID.get_account_id();
  use_effect(() => {
    if (account_id === null) {
      set_rows(null);
      set_error(null);
      return;
    }
    let cancelled = false;
    set_error(null);
    void fetch_rhea_dcl_rows_fun(account_id)
      .then((result) => {
        if (!cancelled) set_rows(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        set_rows(null);
        set_error(err instanceof Error ? err.message : String(err));
        console.warn("[account_rhea_dcl_balance_table] fetch failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, [account_id]);
  if (account_id === null) return <></>;
  if (error === null && (rows === null || rows.length === 0)) return <></>;
  return (
    <>
      <h2 class="huggies-section-title">RHEA DCL INTERNAL BALANCE</h2>
      {error !== null ? (
        <p data-huggies-rhea-dcl-balance-error={error}>{error}</p>
      ) : (
        <div class="huggies-scroll">
          <table data-huggies-rhea-dcl-balance-account={account_id}>
            <tbody>
              {rows?.map((row) =>
                huggies_balance_row_fun({
                  id: row.id,
                  raw: row.raw,
                  info: row.info,
                }),
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
// ========================================
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_ACCOUNT_RHEA_DCL_BALANCE_TABLE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    HUGGIES_ACCOUNT_ID.init();
    render(<HUGGIES_COMPONENT_ACCOUNT_RHEA_DCL_BALANCE_TABLE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
