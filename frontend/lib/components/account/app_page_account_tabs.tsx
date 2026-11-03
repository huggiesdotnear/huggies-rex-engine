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
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_ACCOUNT_TAB_STATE } from "../../ts/account/app_page_account_tab_state";
import { SHIT_1170_ACCOUNT_TABS } from "../../ts/account/app_page_account_tab_defs";
import { SHIT_1170_URL_TAB } from "../../ts/account/app_page_account_tab_url";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the href of a tab.
//
// --- WHY --- IT COMES FROM THE URL MODULE: the link a reader copies
// has to be the url they get when they click it, so the href and the
// written url are built by the same code.
function tab_href_fun(name: string): string {
  return SHIT_1170_URL_TAB.href(name);
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_ACCOUNT_TABS_FUN(): preact.JSX.Element {
  // --- WHY --- the tab comes from the state: it holds the tab on
  // screen, so the bar and the page's other components always agree on
  // which view is showing.
  const tab = use_page_store_fun(SHIT_1170_APP_PAGE_ACCOUNT_TAB_STATE);

  return (
    // --- WHY --- IT IS NOT A `<nav>`: the app-wide nav rule
    // (base/nav.css) styles every `<nav>` as the fixed bottom bar, so
    // a `<nav>` here would be pinned to the bottom of the screen on
    // top of the app's own nav.
    //
    // --- WHY --- THERE IS NO `role="tablist"`: a real tab widget needs
    // the tab role ON the links, a tabpanel for the content, and arrow
    // key navigation between the tabs. this bar is a row of links that
    // switches the view, and `aria-current` already says which one is
    // showing — so a half-made tab role would tell a screen reader the
    // wrong thing.
    <div class="account-tabs" aria-label="account views">
      {SHIT_1170_ACCOUNT_TABS.map((item) => {
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
              SHIT_1170_APP_PAGE_ACCOUNT_TAB_STATE.set_tab(item.name);
            }}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_ACCOUNT_TABS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_ACCOUNT_TABS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
