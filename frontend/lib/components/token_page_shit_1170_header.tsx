// ========================================
// the page heading on the $SHIT page: the token's own id.
//
// the token id is the page's identity, not data — the page is FOR that
// one token, so the id is a constant and not something the api is asked
// for.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_SHIT_TOKEN_ID } from "../ts/token_page_shit_1170_token";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_HEADER_FUN() {
  return (
    <header>
      <h1>{HUGGIES_SHIT_TOKEN_ID}</h1>
    </header>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_HEADER;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_HEADER_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
