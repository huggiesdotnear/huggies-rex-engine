// ========================================
// the account id box on the Pumpopoly page.
//
// the box itself is shared — frontend/lib/components/shared/id_jump_box.tsx
// — because the token page and the DAO page have the same box with
// different wording. this component supplies the Pumpopoly wording.
//
// mounts into
// <div id="SHIT_1170_COMPONENT_CONTRACT_PUMPOPOLY_ACCOUNT_SELECTOR">.
// ========================================
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../../ts/shared/mount_ids";
import { SHIT_1170_CONTRACT_PAGE_PUMPOPOLY_STORE } from "../../../ts/contract/pumpopoly/contract_page_pumpopoly_store";
import { use_page_store_fun } from "../../../ts/shared/use_page_store";
import { shit_1170_id_jump_box_fun } from "../../shared/id_jump_box";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function SHIT_1170_COMPONENT_CONTRACT_PUMPOPOLY_ACCOUNT_SELECTOR_FUN() {
  // --- WHY --- the id comes from the store: it watches the id and
  // re-loads when it changes, so the id and the data change together.
  use_page_store_fun(SHIT_1170_CONTRACT_PAGE_PUMPOPOLY_STORE);
  const account_id = SHIT_1170_CONTRACT_PAGE_PUMPOPOLY_STORE.get_account_id();

  return (
    <>
      {shit_1170_id_jump_box_fun({
        id: account_id,
        label: "ACCOUNT ID",
        placeholder: "account.near",
        button_text: "INSPECT PLAYER ACCOUNT",
        param_name: "id",
        class_prefix: "pumpopoly",
      })}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_CONTRACT_PUMPOPOLY_ACCOUNT_SELECTOR;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<SHIT_1170_COMPONENT_CONTRACT_PUMPOPOLY_ACCOUNT_SELECTOR_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
