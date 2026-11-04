// ========================================
// the feed's status line: what the page is doing while it loads, and
// what went wrong when it failed.
//
// on a page that loaded it renders nothing at all — the posts take over.
//
// --- WHY THE PAGE HAS A STATUS LINE AT ALL: a reader who opens the feed
// while the backend is down sees an empty page and no idea why. the
// line says what happened.
//
// mounts into <div id="SHIT_1170_COMPONENT_APP_PAGE_FEED_STATUS">.
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_FEED_STORE } from "../../ts/feed/app_page_feed_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_APP_PAGE_FEED_STATUS_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_FEED_STORE);
  // the feed loaded — the posts take over.
  if (state.error === null) return null;
  // the load failed — say what went wrong.
  return <p class="feed-status is-error">{state.error}</p>;
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_APP_PAGE_FEED_STATUS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_APP_PAGE_FEED_STATUS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
