// ========================================
// the transaction page's status line: what the page is doing while it
// loads, and what went wrong when it failed.
//
// on a page that loaded it renders nothing at all — the transaction
// takes over.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_APP_PAGE_TX_STORE } from "../ts/app_page_tx_store";
import { use_page_store_fun } from "../ts/use_page_store";
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function HUGGIES_COMPONENT_TX_STATUS_FUN() {
  const state = use_page_store_fun(HUGGIES_APP_PAGE_TX_STORE);
  // the page loaded — the transaction's own components take over.
  if (state.data !== null) return null;
  // the load failed — say what went wrong.
  if (state.error !== null) {
    return <p class="tx-status is-error">{state.error}</p>;
  }
  // still loading.
  return <p class="tx-status">LOADING TRANSACTION...</p>;
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TX_STATUS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_TX_STATUS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
