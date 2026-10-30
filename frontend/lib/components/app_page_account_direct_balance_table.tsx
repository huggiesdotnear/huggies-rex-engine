// ========================================
// the account's direct and native token balances.
//
// this component does NOT fetch. the account page has one loader
// (lib/ts/app_page_account.ts); this reads its store
// (lib/ts/app_page_account_store.ts).
//
// the rows go to the shared balance table
// (lib/components/shared/balance_table.tsx), which the dao page uses too.
// amounts are rendered human-readable via token_amount_format.ts. one row
// per token, each field stacked in a single column so the table never needs
// horizontal scrolling. mounts into
// <div id="HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE">.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_APP_PAGE_ACCOUNT_STORE } from "../ts/app_page_account_store";
import { use_page_store_fun } from "../ts/use_page_store";
import { huggies_balance_table_fun } from "./shared/balance_table";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE_FUN() {
  // ========================================
  // --- WHY --- the id comes from the store: it watches the id and
  // re-loads when it changes, so the id and the data change together.
  const account_id = HUGGIES_APP_PAGE_ACCOUNT_STORE.get_account_id();
  const page_data = use_page_store_fun(HUGGIES_APP_PAGE_ACCOUNT_STORE);

  // no `?id=` on this url — render nothing.
  if (account_id === null) return <></>;

  return (
    <>
      {huggies_balance_table_fun({
        rows: page_data?.direct ?? [],
        title: null,
        loading: page_data === null,
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
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
