// ========================================
// the $SHIT page's status line: what the page says while the load is
// running and when it failed.
//
// it reads the page's store. it fetches nothing.
import { render } from "preact";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKENS_PAGE_SHIT_1170_STATE } from "../ts/tokens_page_shit_1170_state";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_SHIT_1170_STATUS_FUN() {
  const [, set_revision] = use_state(0);

  use_effect(() => {
    const unsubscribe = HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const state = HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.get();

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
