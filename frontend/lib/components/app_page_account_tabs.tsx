// ========================================
// the account page's tab bar: the thin bar of links under the page's
// heading that switches between the page's views.
//
// it shows the account's two views — the balances and the
// transactions — and the tab that is showing is the one that is
// highlighted.
//
// it reads the tab from the page's tab state and writes to it when the
// reader picks one. it fetches nothing.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_APP_PAGE_ACCOUNT_TAB_STATE } from "../ts/app_page_account_tab";
import { HUGGIES_ACCOUNT_TABS } from "../ts/app_page_account_tabs";
import { use_page_store_fun } from "../ts/use_page_store";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the href of a tab.
//
// --- WHY THE DEFAULT TAB HAS NO `?tab=`: it is the view most readers
// want, and a url without a parameter is the cleanest way to say it.
// the second tab carries its name, so it can be linked to directly.
//
// --- WHY --- the href KEEPS the other parameters: the url carries the
// account the reader is looking at, and a tab link that dropped it
// would take the account away.
//
// --- WHY --- the link works without javascript: the click handler
// below only makes the switch instant. without it the browser follows
// the href, and the page reads the tab off the url and shows the same
// view.
function tab_href_fun(name: string): string {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return "";
  }
  const url = new URL(window.location.href);
  if (name === HUGGIES_ACCOUNT_TABS[0].name) {
    url.searchParams.delete("tab");
  } else {
    url.searchParams.set("tab", name);
  }
  // the path and the search only — the hash is not part of the page's
  // own state.
  return `${url.pathname}${url.search}`;
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function HUGGIES_COMPONENT_ACCOUNT_TABS_FUN(): preact.JSX.Element {
  // --- WHY --- the tab comes from the state: it holds the tab on
  // screen, so the bar and the page's other components always agree on
  // which view is showing.
  const tab = use_page_store_fun(HUGGIES_APP_PAGE_ACCOUNT_TAB_STATE);

  return (
    <nav class="account-tabs" aria-label="account views">
      {HUGGIES_ACCOUNT_TABS.map((item) => {
        const is_active = item.name === tab;
        return (
          <a
            class={is_active ? "is-active" : ""}
            href={tab_href_fun(item.name)}
            aria-current={is_active ? "page" : undefined}
            onClick={(event) => {
              // --- WHY --- the click is handled here and not left to
              // the browser: the tab bar is a plain link, so a reader
              // can open it in a new tab or copy it, and the link
              // still works without javascript. the handler only
              // stops the default navigation for the ordinary click.
              //
              // --- WHY --- the default is stopped: the browser would
              // reload the page, and the tab is a switch between two
              // views of the page that is already loaded. the state
              // changes the view and the url follows it.
              //
              // --- WHY --- a MODIFIER CLICK IS LEFT ALONE: a reader
              // who asks for a new tab gets a new page with the tab
              // in its url, and that is exactly what they asked for.
              if (
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              ) {
                return;
              }
              event.preventDefault();
              HUGGIES_APP_PAGE_ACCOUNT_TAB_STATE.set_tab(item.name);
            }}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_ACCOUNT_TABS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_ACCOUNT_TABS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
