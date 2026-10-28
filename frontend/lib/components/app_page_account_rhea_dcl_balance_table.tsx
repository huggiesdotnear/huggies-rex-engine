// ========================================
// the account's rhea dcl v2 internal balances.
//
// this component does NOT fetch. the account page has one loader
// (lib/ts/app_page_account.ts) and this component reads its result from the
// page store (lib/ts/app_page_account_store.ts). read that file to see what
// the account page requests.
//
// the table is the shared one (lib/components/balance_table.tsx).
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_APP_PAGE_ACCOUNT_STORE } from "../ts/app_page_account_store";
import { use_page_store_fun } from "../ts/use_page_store";
import { huggies_balance_table_fun } from "./shared/balance_table";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_ACCOUNT_RHEA_DCL_BALANCE_TABLE_FUN() {
  // ========================================
  // --- WHY --- the id comes from the store: the store watches the id
  // and re-loads when it changes, so the components read one place
  // for both the id and the data, and they follow it.
  const account_id = HUGGIES_APP_PAGE_ACCOUNT_STORE.get_account_id();
  const page_data = use_page_store_fun(HUGGIES_APP_PAGE_ACCOUNT_STORE);

  // no `?id=` on this url — render nothing.
  if (account_id === null) return <></>;

  const rows = page_data?.rhea_dcl ?? [];
  // still loading, or the account has no balances at all: render
  // nothing, so an account that never used rhea sees no empty section.
  if (rows.length === 0) return <></>;

  return (
    <>
      {huggies_balance_table_fun({
        rows,
        title: "RHEA DCL INTERNAL BALANCE",
        loading: false,
        empty_text: "NO BALANCES",
        account_id,
      })}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_ACCOUNT_RHEA_DCL_BALANCE_TABLE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_ACCOUNT_RHEA_DCL_BALANCE_TABLE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
