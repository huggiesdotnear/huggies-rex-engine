// ========================================
// the one hook a page's components use to read their page's store.
//
// every component that shows page data used to write the same two
// effects by hand: one to subscribe to the store, one to force a
// re-render when the store changed. this hook is those two effects,
// written once.
//
// a component that uses it only displays. it never loads and it never
// subscribes:
//
//   const state = use_page_store_fun(HUGGIES_TOKENS_PAGE_TOKEN_STATE);
//
// --- WHY --- this lives in lib/ts and not in lib/components: a hook
// does not need jsx. it is plain ts that happens to call preact's
// hooks, so it belongs with the other plain ts of the page.
//
// --- WHY --- the store is a parameter and not a hardcoded import: the
// hook is shared by every page, and each page has its own store.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
// ========================================
// the shape every page's store has, so this hook can drive any of them.
//
// --- WHY --- only get and subscribe are here: those are the two the
// hook actually uses. the store's load is NOT in this shape — the hook
// never calls it, and a page's load takes whatever that page needs
// (an id, a sort, nothing at all), so putting it here would either
// force every page's load to have the same signature or hide the
// difference behind a type that accepts anything.
export interface HUGGIES_PAGE_STORE<STATE> {
  // the current state.
  get: () => STATE;
  // register a callback that fires when the state changes. returns an
  // unsubscribe so a component can clean up on unmount.
  subscribe: (listener: () => void) => () => void;
}
// ========================================
// --- HOOK ------------------------------
// read a page's store and re-render when it changes.
//
// --- WHY --- the revision counter: preact does not re-render a
// component because some outside state changed. it only re-renders
// when its own state changes. so the component keeps a counter and
// bumps it whenever the store announces something. the value is not
// used — only the bump matters.
export function use_page_store_fun<STATE>(
  store: HUGGIES_PAGE_STORE<STATE>,
): STATE {
  const [, set_revision] = use_state(0);

  use_effect(() => {
    const unsubscribe = store.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, [store]);

  return store.get();
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
