// ========================================
// discover links for supported smart contracts.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import {
  contract_page_href_fun,
  list_contract_cards_fun,
} from "../ts/app_page_discover_contract_cards";
// ========================================
// shared smart-contract discover component.
function HUGGIES_COMPONENT_CONTRACT_DISCOVER_FUN() {
  return (
    <div class="huggies-contract-cards">
      {list_contract_cards_fun().map((card) => (
        <a
          class="huggies-contract-card"
          href={contract_page_href_fun(card.page)}
        >
          <strong>{card.title}</strong>
          <code>{card.contract_id}</code>
        </a>
      ))}
    </div>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_DISCOVER;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_DISCOVER_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
