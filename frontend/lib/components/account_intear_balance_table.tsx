// ========================================
// the account's intear dex internal balances.
//
// this component does NOT fetch. the account page has one loader
// (lib/ts/account_page.ts) and this component reads its result from the
// page store (lib/ts/account_page_store.ts). read that file to see what
// the account page requests.
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_ACCOUNT_ID } from "../ts/account_id";
import { HUGGIES_ACCOUNT_PAGE_STORE } from "../ts/account_page_store";
import { huggies_balance_row_fun } from "../ts/balance_row";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_ACCOUNT_INTEAR_BALANCE_TABLE_FUN() {
  // ========================================
  const [, set_revision] = use_state(0);
  const account_id = HUGGIES_ACCOUNT_ID.get_account_id();

  use_effect(() => {
    if (account_id === null) return;
    const unsubscribe = HUGGIES_ACCOUNT_PAGE_STORE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    void HUGGIES_ACCOUNT_PAGE_STORE.load(account_id);
    return unsubscribe;
  }, [account_id]);

  // no `?id=` on this url — render nothing.
  if (account_id === null) return <></>;

  const rows = HUGGIES_ACCOUNT_PAGE_STORE.get_data()?.intear ?? [];
  // still loading, or the account has no balances at all: render
  // nothing, so an account that never used the dex sees no empty
  // section.
  if (rows.length === 0) return <></>;

  return (
    <>
      <h2 class="huggies-section-title">INTEAR DEX INTERNAL BALANCE</h2>
      <div class="huggies-scroll">
        <table data-huggies-intear-balance-account={account_id}>
          <tbody>
            {rows.map((row) =>
              huggies_balance_row_fun({
                id: row.id,
                raw: row.raw,
                info: row.info,
                usd_value: row.usd_value,
              }),
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
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
