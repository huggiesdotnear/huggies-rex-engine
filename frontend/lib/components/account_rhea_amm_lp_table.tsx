// ========================================
// account's Rhea AMM liquidity-provider positions.
// ========================================
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import {
  rhea_ammv2_get_pools_fun_json,
  rhea_ammv2_contractid,
} from "@near-kit-tool-box/fun";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_ACCOUNT_ID } from "../ts/account_id";
import { HUGGIES_NETWORK } from "../ts/network";
import { near_kit_client } from "@near-kit-tool-box/web";
import {
  rhea_ammv2_get_number_of_pools_fun_json,
  rhea_ammv2_get_pool_shares_batch_fun_json,
} from "../../../middleman/near_kit_tool_box";
// ========================================
const HUGGIES_RHEA_AMM_POOL_CAP = 500;
const HUGGIES_RHEA_AMM_BATCH_LIMIT = 100;
// ========================================
interface HUGGIES_RHEA_AMM_ROW {
  pool_id: number;
  token_ids: ReadonlyArray<string>;
  shares: string;
}
// ========================================
// fetch a bounded range of Rhea pools and the account's non-zero LP positions.
async function fetch_rhea_amm_rows_fun(
  account_id: string,
): Promise<ReadonlyArray<HUGGIES_RHEA_AMM_ROW>> {
  const near = near_kit_client();
  const contract_id = rhea_ammv2_contractid(HUGGIES_NETWORK);
  const pool_count = await rhea_ammv2_get_number_of_pools_fun_json(
    near,
    contract_id,
  );
  const checked_pool_count = Math.min(
    Math.max(0, Math.trunc(pool_count)),
    HUGGIES_RHEA_AMM_POOL_CAP,
  );
  const pools = await rhea_ammv2_get_pools_fun_json(
    near,
    contract_id,
    0,
    checked_pool_count,
  );
  const rows: Array<HUGGIES_RHEA_AMM_ROW> = [];
  for (
    let offset = 0;
    offset < checked_pool_count;
    offset += HUGGIES_RHEA_AMM_BATCH_LIMIT
  ) {
    const pool_ids = Array.from(
      {
        length: Math.min(
          HUGGIES_RHEA_AMM_BATCH_LIMIT,
          checked_pool_count - offset,
        ),
      },
      (_value, index) => offset + index,
    );
    const shares = await rhea_ammv2_get_pool_shares_batch_fun_json(
      near,
      contract_id,
      pool_ids,
      account_id,
    );
    shares.forEach((amount, index) => {
      if (amount === "0") return;
      const pool_id = pool_ids[index];
      const pool = pools[pool_id];
      if (pool === undefined) return;
      rows.push({ pool_id, token_ids: pool.token_account_ids, shares: amount });
    });
  }
  return rows;
}
// ========================================
// render the account's Rhea AMM LP positions.
function HUGGIES_COMPONENT_ACCOUNT_RHEA_AMM_LP_TABLE_FUN() {
  // ========================================
  const [rows, set_rows] =
    use_state<ReadonlyArray<HUGGIES_RHEA_AMM_ROW> | null>(null);
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
    void fetch_rhea_amm_rows_fun(account_id)
      .then((result) => {
        if (!cancelled) set_rows(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        set_rows(null);
        set_error(err instanceof Error ? err.message : String(err));
        console.warn("[account_rhea_amm_lp_table] fetch failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, [account_id]);
  if (account_id === null) return <></>;
  if (error === null && (rows === null || rows.length === 0)) return <></>;
  return (
    <>
      <h2 class="huggies-section-title">RHEA AMM LP POSITION</h2>
      {error !== null ? (
        <p data-huggies-rhea-amm-lp-error={error}>{error}</p>
      ) : (
        <div class="huggies-scroll">
          <table data-huggies-rhea-amm-lp-account={account_id}>
            <tbody>
              {rows?.map((row) => (
                <tr key={String(row.pool_id)}>
                  <td>
                    <div class="huggies-lp-row-head">
                      <span class="huggies-lp-pair">
                        {row.token_ids.join(" / ")}
                      </span>
                      <span class="huggies-lp-shares">{row.shares} SHARES</span>
                    </div>
                    <div class="huggies-contract">POOL #{row.pool_id}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            SCOPE: FIRST {HUGGIES_RHEA_AMM_POOL_CAP} POOLS (POOL IDs 0–
            {Math.max(0, HUGGIES_RHEA_AMM_POOL_CAP - 1)}); positions outside
            this range are not shown.
          </p>
        </div>
      )}
    </>
  );
}
// ========================================
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_ACCOUNT_RHEA_AMM_LP_TABLE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    HUGGIES_ACCOUNT_ID.init();
    render(<HUGGIES_COMPONENT_ACCOUNT_RHEA_AMM_LP_TABLE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
