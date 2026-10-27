// ========================================
// the links to the other smart-contract pages, at the bottom of the
// Pumpopoly page.
//
// the rest of the page is four more components, each with its own mount
// id in the html:
//
//   HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_ERRORS
//   HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_ACCOUNT_SELECTOR
//   HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS
//   HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_NFT_LIST
//   HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_INVITE
//
// this component does NOT fetch — the contract list is a constant in
// lib/ts/app_page_discover_contract_cards.ts.
//
// mounts into
// <div id="HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_CONTRACT_LINKS">.
// ========================================
import { render } from "preact";
import {
  contract_page_href_fun,
  list_contract_cards_fun,
} from "../ts/app_page_discover_contract_cards";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_CONTRACT_LINKS_FUN() {
  return (
    <>
      <nav class="huggies-contract-links" aria-label="smart contracts">
        {list_contract_cards_fun().map((card) => (
          <a href={contract_page_href_fun(card.page)}>{card.title}</a>
        ))}
      </nav>
    </>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_CONTRACT_LINKS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_CONTRACT_LINKS_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
