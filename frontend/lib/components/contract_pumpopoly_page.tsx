// ========================================
// the Pumpopoly page's chrome: the data-limitations box and the links
// to the other smart-contract pages.
//
// the page body is not here. it is four separate components, each with
// its own mount id in the html:
//
//   HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_ACCOUNT_SELECTOR
//   HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS
//   HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_NFT_LIST
//   HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_INVITE
//
// the errors are read from the page store, which is where the one
// loader puts them.
//
// --- WHY --- no balance panel on the Pumpopoly page. it asked for
// the signed-in account's balances, but the page is about a player
// named in the url, so the panel showed someone else's money next
// to another player's stats. the Pumpopoly cards already carry the
// player's own token balance.
//
// mounts into
// <div id="HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PAGE">.
// ========================================
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_PAGE_ACCOUNT_ID } from "../ts/page_account_id";
import { HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE } from "../ts/contract_page_pumpopoly_store";
import {
  contract_page_href_fun,
  list_contract_cards_fun,
} from "../ts/app_page_discover_contract_cards";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PAGE_FUN() {
  // --- WHY --- a revision counter forces a re-render when the store
  // lands; preact doesn't re-render from external state changes alone.
  const [, set_revision] = use_state(0);

  use_effect(() => {
    const unsubscribe = HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const errors = HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE.get_data()?.errors ?? [];

  return (
    <div class="huggies-contract-page huggies-page">
      {errors.length > 0 && (
        <details class="huggies-contract-errors">
          <summary>DATA LIMITATIONS</summary>
          <ul>
            {errors.map((error) => (
              <li>{error}</li>
            ))}
          </ul>
        </details>
      )}
      <nav class="huggies-contract-links" aria-label="smart contracts">
        {list_contract_cards_fun().map((card) => (
          <a href={contract_page_href_fun(card.page)}>{card.title}</a>
        ))}
      </nav>
    </div>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PAGE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    HUGGIES_PAGE_ACCOUNT_ID.init();
    render(<HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PAGE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
