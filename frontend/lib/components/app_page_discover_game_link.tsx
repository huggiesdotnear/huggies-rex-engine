// ========================================
// the hidden game link that sits under the auth button.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
// ========================================
// the easter-egg link to the memory game.
function HUGGIES_COMPONENT_APP_PAGE_DISCOVER_GAME_LINK_FUN() {
  return (
    <a class="huggies-game-link" href="game.html">
      🃏 EMOJI GAME
    </a>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_APP_PAGE_DISCOVER_GAME_LINK;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<HUGGIES_COMPONENT_APP_PAGE_DISCOVER_GAME_LINK_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
