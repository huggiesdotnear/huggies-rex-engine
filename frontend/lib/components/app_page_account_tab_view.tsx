// ========================================
// the tab gate: it renders its children only when the account page is
// showing the tab it names.
//
// the account page has more views than one — the balances and the
// transactions — and each view's components belong to a tab. without
// a gate, every component would have to ask the tab state the same
// question and return early, and one of them would forget.
//
// --- WHY --- IT IS A PAGE COMPONENT AND NOT A SHARED ONE: it is used
// by the account page's balance tables and by nothing else, so it
// carries the account page's prefix.
//
// --- WHY --- IT HAS NO MARKUP OF ITS OWN: a gate is a decision, not a
// thing on the screen. it renders its children and nothing else, so
// there is no element of its own to style.
//
// this component does NOT fetch. it renders nothing when the tab on
// screen is not the one it names.
import { HUGGIES_APP_PAGE_ACCOUNT_TAB_STATE } from "../ts/account/app_page_account_tab_state";
import { use_page_store_fun } from "../ts/shared/use_page_store";
import type { ComponentChildren } from "preact";
// ========================================
// ========================================
// --- PROPS ------------------------------
export interface HUGGIES_APP_PAGE_ACCOUNT_TAB_VIEW_PROPS {
  // the tab whose contents these are.
  tab: "balances" | "transactions";
  // what to render when that tab is the one on screen.
  children: ComponentChildren;
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function huggies_account_tab_view_fun(
  props: HUGGIES_APP_PAGE_ACCOUNT_TAB_VIEW_PROPS,
): preact.JSX.Element {
  const tab = use_page_store_fun(HUGGIES_APP_PAGE_ACCOUNT_TAB_STATE);
  if (tab !== props.tab) return <></>;
  return <>{props.children}</>;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
