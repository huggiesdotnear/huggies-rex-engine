// ========================================
// the token id box on the token page.
//
// the box itself is shared — frontend/lib/components/id_jump_box.tsx
// — because the pumpopoly page and the DAO page have the same box
// with different wording. this component supplies the token wording.
//
// mounts into
// <div id="HUGGIES_COMPONENT_TOKEN_SELECTOR">.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKENS_PAGE_TOKEN_ID } from "../ts/tokens_page_token_id";
import { huggies_id_jump_box_fun } from "./id_jump_box";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_TOKEN_SELECTOR_FUN() {
  // --- WHY --- the id is read once, with no subscription. the jump box
  // writes a new id to the url and the browser navigates, so the page
  // is a fresh document with a fresh id — there is nothing to watch.
  const token_id = HUGGIES_TOKENS_PAGE_TOKEN_ID.get();

  return (
    <>
      {huggies_id_jump_box_fun({
        id: token_id,
        label: "TOKEN ACCOUNT ID",
        placeholder: "token.near",
        button_text: "OPEN TOKEN",
        param_name: "id",
        class_prefix: "huggies-token",
      })}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TOKEN_SELECTOR;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_TOKEN_SELECTOR_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
