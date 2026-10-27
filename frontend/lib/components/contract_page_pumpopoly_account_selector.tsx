// ========================================
// the account id box on the Pumpopoly page.
//
// the box itself is shared — frontend/lib/components/id_jump_box.tsx
// — because the token page and the DAO page have the same box with
// different wording. this component supplies the Pumpopoly wording.
//
// mounts into
// <div id="HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_ACCOUNT_SELECTOR">.
// ========================================
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_PAGE_ACCOUNT_ID } from "../ts/page_account_id";
import { huggies_id_jump_box_fun } from "./id_jump_box";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_ACCOUNT_SELECTOR_FUN() {
  // --- WHY --- a revision counter forces a re-render when the page's
  // id changes; preact doesn't re-render from external state changes
  // alone.
  const [, set_revision] = use_state(0);

  use_effect(() => {
    const unsubscribe = HUGGIES_PAGE_ACCOUNT_ID.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const account_id = HUGGIES_PAGE_ACCOUNT_ID.get_account_id();

  return (
    <>
      {huggies_id_jump_box_fun({
        id: account_id,
        label: "ACCOUNT ID",
        placeholder: "account.near",
        button_text: "INSPECT PLAYER ACCOUNT",
        param_name: "id",
        class_prefix: "huggies-pumpopoly",
      })}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_ACCOUNT_SELECTOR;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    HUGGIES_PAGE_ACCOUNT_ID.init();
    render(<HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_ACCOUNT_SELECTOR_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
