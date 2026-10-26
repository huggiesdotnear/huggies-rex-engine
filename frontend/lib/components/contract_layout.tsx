// ========================================
// the chrome every smart-contract page shares: the page wrapper,
// the signed-in account's balance panel, the data-limitations box
// and the links to the other contracts.
// ========================================
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_AUTH } from "../ts/auth_status";
import {
  contract_page_href_fun,
  list_contract_cards_fun,
} from "../ts/contract_cards";
import { huggies_balance_panel_fun } from "./balance_panel";
// ========================================
export interface HUGGIES_CONTRACT_LAYOUT_PROPS {
  title: string;
  children: preact.ComponentChildren;
  show_balance?: boolean;
  errors?: ReadonlyArray<string>;
}
// ========================================
// the shared wrapper for one smart-contract page.
export function huggies_contract_layout_fun(
  props: HUGGIES_CONTRACT_LAYOUT_PROPS,
): preact.JSX.Element {
  const [account_id, set_account_id] = use_state<string | null>(null);

  use_effect(() => {
    HUGGIES_AUTH.init();
    const unsubscribe = HUGGIES_AUTH.subscribe(() => {
      set_account_id(HUGGIES_AUTH.get_account_id());
    });
    set_account_id(HUGGIES_AUTH.get_account_id());
    return unsubscribe;
  }, []);

  const errors = props.errors ?? [];

  return (
    <div class="huggies-contract-page huggies-page">
      {props.children}
      {props.show_balance !== false && account_id !== null && (
        <div class="huggies-balance-table">
          {huggies_balance_panel_fun({
            account_id,
            title: "YOUR BALANCE",
          })}
        </div>
      )}
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
// copyright 2026 by sleet.near
// ========================================
