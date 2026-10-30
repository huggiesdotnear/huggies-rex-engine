// ========================================
// the token page's status line: what the page says while the load is
// running, when it failed, and when the url carried no token id.
//
// it reads the page's store through the shared hook. it fetches nothing
// — the page's start script runs the load.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKEN_PAGE_TOKEN_STATE } from "../ts/token_page_token_state";
import { use_page_store_fun } from "../ts/use_page_store";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_TOKEN_STATUS_FUN() {
  const state = use_page_store_fun(HUGGIES_TOKEN_PAGE_TOKEN_STATE);

  // --- WHY --- the status only shows while there is no token card to
  // show. once the metadata has loaded, the card and the holders table
  // take over and the status line would be a second, contradicting
  // answer.
  if (state.detail !== null) return null;

  if (HUGGIES_TOKEN_PAGE_TOKEN_STATE.get_token_id() === null) {
    return <p>TOKEN ID MISSING</p>;
  }
  if (state.error !== null) return <p>{state.error}</p>;
  return <p>LOADING TOKEN...</p>;
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TOKEN_STATUS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_TOKEN_STATUS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
