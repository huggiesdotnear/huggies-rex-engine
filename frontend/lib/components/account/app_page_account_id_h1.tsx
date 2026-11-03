// ========================================
// <h1> showing the account id the current page is about. it reads the
// id from the page's store and renders nothing when there is none.
// mounts into <h1 id="SHIT_1170_COMPONENT_ACCOUNT_ID_H1">.
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_ACCOUNT_STORE } from "../../ts/account/app_page_account_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function SHIT_1170_COMPONENT_ACCOUNT_ID_H1_FUN() {
  // --- WHY --- the id comes from the store: it watches the id and
  // re-loads when it changes, so the id and the data change together.
  use_page_store_fun(SHIT_1170_APP_PAGE_ACCOUNT_STORE);
  const account_id = SHIT_1170_APP_PAGE_ACCOUNT_STORE.get_account_id();
  // no `?id=` on this url — render nothing rather than an empty heading.
  if (account_id === null) return <></>;

  return <>{account_id}</>;
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_ACCOUNT_ID_H1;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<SHIT_1170_COMPONENT_ACCOUNT_ID_H1_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
