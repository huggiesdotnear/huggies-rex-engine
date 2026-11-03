// ========================================
// the page heading on the $SHIT page: the token's own id.
//
// the token id is the page's identity, not data — the page is FOR that one
// token, so the id is a constant and not something the api is asked for.
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../../ts/shared/mount_ids";
import { SHIT_1170_SHIT_TOKEN_ID } from "../../../ts/shared/shit_1170_token";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function SHIT_1170_COMPONENT_TOKEN_PAGE_SHIT_1170_HEADER_FUN() {
  return (
    <header>
      <h1>{SHIT_1170_SHIT_TOKEN_ID}</h1>
    </header>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_TOKEN_PAGE_SHIT_1170_HEADER;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<SHIT_1170_COMPONENT_TOKEN_PAGE_SHIT_1170_HEADER_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
