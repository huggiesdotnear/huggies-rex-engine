// ========================================
// the token id box on the token page.
//
// the box itself is shared — frontend/lib/components/shared/id_jump_box.tsx
// — because the pumpopoly page and the DAO page have the same box with
// different wording. this component supplies the token wording.
//
// mounts into
// <div id="SHIT_1170_COMPONENT_TOKEN_SELECTOR">.
// ========================================
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../../ts/shared/mount_ids";
import { SHIT_1170_TOKEN_PAGE_TOKEN_STATE } from "../../../ts/token/index/token_page_token_state";
import { shit_1170_id_jump_box_fun } from "../../shared/id_jump_box";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function SHIT_1170_COMPONENT_TOKEN_SELECTOR_FUN() {
  // --- WHY --- the id is read once, with no subscription. the jump box
  // writes a new id to the url and the browser navigates, so the page is
  // a fresh document with a fresh id — there is nothing to watch.
  const token_id = SHIT_1170_TOKEN_PAGE_TOKEN_STATE.get_token_id();

  return (
    <>
      {shit_1170_id_jump_box_fun({
        id: token_id,
        label: "TOKEN ACCOUNT ID",
        placeholder: "token.near",
        button_text: "OPEN TOKEN",
        param_name: "id",
        class_prefix: "token",
      })}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_TOKEN_SELECTOR;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<SHIT_1170_COMPONENT_TOKEN_SELECTOR_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
