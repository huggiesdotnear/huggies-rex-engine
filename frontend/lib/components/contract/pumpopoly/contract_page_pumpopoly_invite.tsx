// ========================================
// the "new players start here" link on the Pumpopoly page.
//
// it sends a visitor to Pumpopoly with the Shit-1170 invite code, so a new
// player joins through this app's referral.
//
// this component does NOT fetch — the invite link is built from a
// constant (lib/ts/contract_page_pumpopoly_link.ts).
//
// mounts into
// <div id="SHIT_1170_COMPONENT_CONTRACT_PUMPOPOLY_INVITE">.
// ========================================
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../../ts/shared/mount_ids";
import {
  SHIT_1170_PUMPOPOLY_INVITE_ACCOUNT,
  pumpopoly_invite_link_fun,
} from "../../../ts/contract/pumpopoly/contract_page_pumpopoly_link";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function SHIT_1170_COMPONENT_CONTRACT_PUMPOPOLY_INVITE_FUN() {
  return (
    <>
      <a
        class="invite"
        href={pumpopoly_invite_link_fun(SHIT_1170_PUMPOPOLY_INVITE_ACCOUNT)}
        target="_blank"
        rel="noreferrer"
      >
        NEW PLAYERS START HERE
      </a>
    </>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_CONTRACT_PUMPOPOLY_INVITE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<SHIT_1170_COMPONENT_CONTRACT_PUMPOPOLY_INVITE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
