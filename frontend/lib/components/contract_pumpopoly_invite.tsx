// ========================================
// the "new players start here" link on the Pumpopoly page.
//
// it sends a visitor to Pumpopoly with the Huggies invite code, so a
// new player joins through this app's referral.
//
// this component does NOT fetch — the invite link is built from a
// constant (lib/ts/contract_page_pumpopoly_link.ts).
//
// mounts into
// <div id="HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_INVITE">.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import {
  HUGGIES_PUMPOPOLY_INVITE_ACCOUNT,
  pumpopoly_invite_link_fun,
} from "../ts/contract_page_pumpopoly_link";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_INVITE_FUN() {
  return (
    <>
      <a
        class="huggies-pumpopoly-invite"
        href={pumpopoly_invite_link_fun(HUGGIES_PUMPOPOLY_INVITE_ACCOUNT)}
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
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_INVITE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_INVITE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
