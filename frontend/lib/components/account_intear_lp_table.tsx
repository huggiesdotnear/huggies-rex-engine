// ========================================
// account's INTEAR DEX XYK liquidity-provider positions.
// ========================================
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_ACCOUNT_ID } from "../ts/account_id";
import { intear_xyk_pool_count_fun } from "../ts/intear_xyk_pool_count";
import { intear_xyk_pool_shares_fun } from "../ts/intear_xyk_pool_shares";
// ========================================
const HUGGIES_INTEAR_XYK_POOL_LIMIT = 71;
const HUGGIES_INTEAR_XYK_SHARES_PAGE_SIZE = 100;
// ========================================
interface HUGGIES_INTEAR_LP_ROW {
  pool_id: number;
  shares: string;
}
// ========================================
// fetch the account's non-zero INTEAR XYK LP positions.
async function fetch_intear_lp_rows_fun(
  account_id: string,
): Promise<ReadonlyArray<HUGGIES_INTEAR_LP_ROW>> {
  const count = Math.min(
    await intear_xyk_pool_count_fun(),
    HUGGIES_INTEAR_XYK_POOL_LIMIT,
  );
  if (count === 0) return [];
  const rows: Array<HUGGIES_INTEAR_LP_ROW> = [];
  for (
    let start_index = 0;
    start_index < count;
    start_index += HUGGIES_INTEAR_XYK_SHARES_PAGE_SIZE
  ) {
    const page_ids = Array.from(
      {
        length: Math.min(
          HUGGIES_INTEAR_XYK_SHARES_PAGE_SIZE,
          count - start_index,
        ),
      },
      (_, index) => start_index + index,
    );
    const shares = await intear_xyk_pool_shares_fun(account_id, page_ids);
    for (let index = 0; index < shares.length; index += 1) {
      const value = shares[index];
      if (value === null || value === undefined || value === "0") continue;
      rows.push({ pool_id: start_index + index, shares: value });
    }
  }
  return rows;
}
// ========================================
// render the account's INTEAR XYK LP positions.
function HUGGIES_COMPONENT_ACCOUNT_INTEAR_LP_TABLE_FUN() {
  // ========================================
  const [rows, set_rows] =
    use_state<ReadonlyArray<HUGGIES_INTEAR_LP_ROW> | null>(null);
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
    void fetch_intear_lp_rows_fun(account_id)
      .then((result) => {
        if (!cancelled) set_rows(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        set_rows(null);
        set_error(err instanceof Error ? err.message : String(err));
        console.warn("[account_intear_lp_table] fetch failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, [account_id]);
  if (account_id === null) return <></>;
  if (error === null && (rows === null || rows.length === 0)) return <></>;
  return (
    <>
      <h2 class="huggies-section-title">INTEAR DEX XYK LP POSITION</h2>
      {error !== null ? (
        <p data-huggies-intear-lp-error={error}>{error}</p>
      ) : (
        <div class="huggies-scroll">
          <table data-huggies-intear-lp-account={account_id}>
            <tbody>
              {rows?.map((row) => (
                <tr key={String(row.pool_id)}>
                  <td>
                    <div class="huggies-lp-row-head">
                      <span class="huggies-lp-pair">
                        XYK POOL #{row.pool_id}
                      </span>
                      <span class="huggies-lp-shares">{row.shares} SHARES</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            SCOPE: FIRST {HUGGIES_INTEAR_XYK_POOL_LIMIT} POOLS (POOL IDs 0–
            {Math.max(0, HUGGIES_INTEAR_XYK_POOL_LIMIT - 1)}); positions outside
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
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_ACCOUNT_INTEAR_LP_TABLE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    HUGGIES_ACCOUNT_ID.init();
    render(<HUGGIES_COMPONENT_ACCOUNT_INTEAR_LP_TABLE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
