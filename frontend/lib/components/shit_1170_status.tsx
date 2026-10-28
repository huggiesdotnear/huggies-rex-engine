// ========================================
// the $SHIT page's status line: what the page says while the load is
// running and when it failed.
//
// it reads the page's store through the shared hook. it fetches
// nothing — the page's start script runs the load.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKEN_PAGE_SHIT_1170_STATE } from "../ts/token_page_shit_1170_state";
import { use_page_store_fun } from "../ts/use_page_store";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_SHIT_1170_STATUS_FUN() {
  const state = use_page_store_fun(HUGGIES_TOKEN_PAGE_SHIT_1170_STATE);

  // --- WHY --- the status only shows while there is nothing else to
  // show. once the holders have loaded, the table takes over and the
  // status line would be a second, contradicting answer.
  if (state.holders.length > 0) return null;

  if (state.error !== null)
    return <p class="huggies-shit-error">{state.error}</p>;
  return <p>LOADING SHIT...</p>;
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_SHIT_1170_STATUS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_SHIT_1170_STATUS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
