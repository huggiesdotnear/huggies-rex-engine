// ========================================
// the hidden $SHIT link that sits under the auth button.
//
// it is the link to the dedicated $SHIT holders page, and it only appears
// on that token's own page — it is an easter egg.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { current_app_depth_fun } from "../ts/app_depth";
import { HUGGIES_SHIT_TOKEN_ID } from "../ts/token_page_shit_1170_token";
import { HUGGIES_URL_ID } from "../ts/url_id";
// ========================================
// --- WHY --- the shared lib/ts/url_id.ts does the reading: the trim and
// the blank-means-absent rule live there, so this link and the token
// page cannot drift apart on which token the page is showing.
function token_id_from_url_fun(): string | null {
  return HUGGIES_URL_ID.read();
}
// ========================================
function HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_PAGE_LINK_FUN() {
  // --- WHY --- the mount div is on every token page, so the link checks
  // the token id itself and renders nothing for any other token. it is an
  // easter egg, so it only appears on its own token.
  const token_id = token_id_from_url_fun();
  if (token_id !== HUGGIES_SHIT_TOKEN_ID) return null;
  // the link is relative, so it resolves against whatever page it sits
  // on. the holders page lives in app/token/, so the prefix walks back up
  // to app/ and back down into token/.
  const href = `${"../".repeat(current_app_depth_fun())}token/shit-1170.html`;
  return (
    <a class="link" href={href}>
      💩 $SHIT
    </a>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_PAGE_LINK;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_PAGE_LINK_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
