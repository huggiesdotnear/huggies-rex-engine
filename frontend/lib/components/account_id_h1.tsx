// ========================================
// <h1> showing the account id the current page is about. reads the
// `?id=` url parameter through lib/ts/app_page_account_id.ts and renders
// nothing when there is none. mounts into
// <h1 id="HUGGIES_COMPONENT_ACCOUNT_ID_H1">.
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_APP_PAGE_ACCOUNT_ID } from "../ts/app_page_account_id";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_ACCOUNT_ID_H1_FUN() {
  // ========================================
  // --- WHY --- a revision counter forces a re-render on every
  // account_id notify; preact doesn't re-render from external state
  // changes alone.
  const [, set_revision] = use_state(0);

  use_effect(() => {
    const unsubscribe = HUGGIES_APP_PAGE_ACCOUNT_ID.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const account_id = HUGGIES_APP_PAGE_ACCOUNT_ID.get_account_id();
  // no `?id=` on this url — render nothing rather than an empty heading.
  if (account_id === null) return <></>;

  return <>{account_id}</>;
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check. init() runs before the first render
// so the heading is already correct on a cold load.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_ACCOUNT_ID_H1;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    HUGGIES_APP_PAGE_ACCOUNT_ID.init();
    render(<HUGGIES_COMPONENT_ACCOUNT_ID_H1_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================