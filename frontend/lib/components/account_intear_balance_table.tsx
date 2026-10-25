// ========================================
// account's INTEAR DEX internal token balances.
// ========================================
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_ACCOUNT_ID } from "../ts/account_id";
import { HUGGIES_TOKEN_INFO } from "../ts/token_info";
import { HUGGIES_AMOUNT_FORMAT } from "../ts/token_amount_format";
import { huggies_balance_row_fun } from "../ts/balance_row";
import { near_kit_client } from "@near-kit-tool-box/web";
import {
  NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID,
  intear_dex_asset_token_id_fun,
  intear_dex_engine_registered_assets_of_fun_json,
} from "../../../middleman/near_kit_tool_box";
import type { HUGGIES_TOKEN_INFO as TOKEN_INFO } from "../ts/token_info";
// ========================================
interface HUGGIES_INTEAR_ROW {
  id: string;
  raw: string;
  info: TOKEN_INFO;
}
// ========================================
// fetch and prepare non-zero INTEAR internal balances.
async function fetch_intear_rows_fun(
  account_id: string,
): Promise<ReadonlyArray<HUGGIES_INTEAR_ROW>> {
  const registered = await intear_dex_engine_registered_assets_of_fun_json(
    near_kit_client(),
    NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID,
    account_id,
    null,
    0,
    500,
  );
  const nonzero = registered.filter((row) => row.balance !== "0");
  if (nonzero.length === 0) return [];
  const ids = nonzero.map((row) => intear_dex_asset_token_id_fun(row.asset_id));
  const info_map = await HUGGIES_TOKEN_INFO.get(ids);
  const rows: Array<HUGGIES_INTEAR_ROW> = [];
  for (const row of nonzero) {
    const id = intear_dex_asset_token_id_fun(row.asset_id);
    const info = info_map.get(id);
    if (info !== undefined) rows.push({ id, raw: row.balance, info });
  }
  rows.sort(
    (a, b) =>
      HUGGIES_AMOUNT_FORMAT.balance_usd(b.raw, b.info) -
      HUGGIES_AMOUNT_FORMAT.balance_usd(a.raw, a.info),
  );
  return rows;
}
// ========================================
// render the account's INTEAR DEX internal balances.
function HUGGIES_COMPONENT_ACCOUNT_INTEAR_BALANCE_TABLE_FUN() {
  // ========================================
  const [rows, set_rows] = use_state<ReadonlyArray<HUGGIES_INTEAR_ROW> | null>(
    null,
  );
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
    void fetch_intear_rows_fun(account_id)
      .then((result) => {
        if (!cancelled) set_rows(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        set_rows(null);
        set_error(err instanceof Error ? err.message : String(err));
        console.warn("[account_intear_balance_table] fetch failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, [account_id]);
  if (account_id === null) return <></>;
  if (error === null && (rows === null || rows.length === 0)) return <></>;
  return (
    <>
      <h2 class="huggies-section-title">INTEAR DEX INTERNAL BALANCE</h2>
      {error !== null ? (
        <p data-huggies-intear-balance-error={error}>{error}</p>
      ) : (
        <div class="huggies-scroll">
          <table data-huggies-intear-balance-account={account_id}>
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
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_ACCOUNT_INTEAR_BALANCE_TABLE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    HUGGIES_ACCOUNT_ID.init();
    render(<HUGGIES_COMPONENT_ACCOUNT_INTEAR_BALANCE_TABLE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
