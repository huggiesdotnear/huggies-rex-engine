// ========================================
// <h1> showing the account id the current page is about. it reads the
// id from the page's store and renders nothing when there is none.
// mounts into <h1 id="HUGGIES_COMPONENT_ACCOUNT_ID_H1">.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_APP_PAGE_ACCOUNT_STORE } from "../ts/app_page_account_store";
import { use_page_store_fun } from "../ts/use_page_store";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_ACCOUNT_ID_H1_FUN() {
  // --- WHY --- the id comes from the store: the store watches the id
  // and re-loads when it changes, so the components read one place for
  // both the id and the data, and they follow it.
  use_page_store_fun(HUGGIES_APP_PAGE_ACCOUNT_STORE);
  const account_id = HUGGIES_APP_PAGE_ACCOUNT_STORE.get_account_id();
  // no `?id=` on this url — render nothing rather than an empty heading.
  if (account_id === null) return <></>;

  return <>{account_id}</>;
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_ACCOUNT_ID_H1;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_ACCOUNT_ID_H1_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
