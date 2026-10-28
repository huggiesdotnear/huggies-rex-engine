// ========================================
// the DAO's token balances.
//
// the table is the shared one (lib/components/balance_table.tsx), the
// same the account page shows, so a dao and an account read the same
// way.
//
// the dao is an account — a contract account — so the row shape is the
// shared one and the ids link to the token pages.
//
// it reads the loaded balances from the page's store. it fetches
// nothing.
//
// mounts into
// <div id="HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_BALANCES">.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_DAO_PAGE_STATE } from "../ts/contract_page_sputnik_dao_state";
import { use_page_store_fun } from "../ts/use_page_store";
import { huggies_balance_table_fun } from "./balance_table";
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_BALANCES_FUN() {
  const page_state = use_page_store_fun(HUGGIES_DAO_PAGE_STATE);

  const state = page_state;
  // no dao on this url, or it has no balances at all: render nothing,
  // so a dao that holds nothing does not show an empty section.
  if (state.dao === null || state.balances.length === 0) return null;

  return (
    <>
      {huggies_balance_table_fun({
        rows: state.balances,
        title: "BALANCES",
        loading: false,
        empty_text: "NO BALANCES",
        account_id: state.dao.id,
      })}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_BALANCES;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_BALANCES_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
