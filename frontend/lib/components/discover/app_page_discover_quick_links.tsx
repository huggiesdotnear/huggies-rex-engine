// ========================================
// the quiet links under the auth button: the emoji game and the burn page.
//
// --- WHY --- both links live in ONE component and sit in ONE row: they
// are the same kind of thing — a quiet shortcut to a hidden page — and
// two separate blocks under the auth button would stack them.
//
// the links stay quiet on purpose: they are meant to be found, so they
// are small, low contrast, and only a little brighter on hover.
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function SHIT_1170_COMPONENT_APP_PAGE_DISCOVER_QUICK_LINKS_FUN() {
  return (
    <div>
      <a href="game.html">🃏 EMOJI GAME</a>
      <a href="burn.html">🔥 BURN</a>
    </div>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_APP_PAGE_DISCOVER_QUICK_LINKS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<SHIT_1170_COMPONENT_APP_PAGE_DISCOVER_QUICK_LINKS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
