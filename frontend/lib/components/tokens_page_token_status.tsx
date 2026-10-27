// ========================================
// the token page's status line: what the page says while the load is
// running, when it failed, and when the url carried no token id.
//
// it reads the page's store. it fetches nothing.
// ========================================
import { render } from "preact";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKENS_PAGE_TOKEN_STATE } from "../ts/tokens_page_token_state";
import { HUGGIES_TOKENS_PAGE_TOKEN_ID } from "../ts/tokens_page_token_id";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_TOKEN_STATUS_FUN() {
  const [, set_revision] = use_state(0);

  use_effect(() => {
    const unsubscribe = HUGGIES_TOKENS_PAGE_TOKEN_STATE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const state = HUGGIES_TOKENS_PAGE_TOKEN_STATE.get();

  // --- WHY --- the status only shows while there is no token card to
  // show. once the metadata has loaded, the card and the holders table
  // take over and the status line would be a second, contradicting
  // answer.
  if (state.detail !== null) return null;

  if (HUGGIES_TOKENS_PAGE_TOKEN_ID.get() === null) {
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
