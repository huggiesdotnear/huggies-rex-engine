// ========================================
// searchable token list for the discover page.
//
// this component does NOT fetch. the discover page has one loader
// (lib/ts/app_page_discover.ts); this reads its store
// (lib/ts/app_page_discover_store.ts).
//
// the list is paged: the api sorts and paginates on its own, so the page
// asks for one page of rows at a time and asks for the next one when the
// reader scrolls to the bottom.
//
// --- WHY --- THE LIST ITSELF IS THE SHARED ONE: the swap page's token
// picker shows the same list of tokens, so the rows, the search box and
// the sort row live in one shared piece (components/shared/token_list.tsx)
// and both pages draw it. this component is what the discover page does
// AROUND that list: it holds the search text, the sort and the direction,
// and it drives the page's store.
//
// mounts into <div id="HUGGIES_COMPONENT_APP_PAGE_DISCOVER_TOKEN_DISCOVER">.
import { render } from "preact";
import {
  useEffect as use_effect,
  useMemo as use_memo,
  useState as use_state,
} from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../../ts/shared/mount_ids";
import { order_discover_tokens_fun } from "../../ts/discover/app_page_discover_token_sort_apply";
import {
  HUGGIES_DEFAULT_TOKEN_SORT,
  HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION,
  type HUGGIES_TOKEN_SORT,
  type HUGGIES_TOKEN_SORT_DIRECTION,
} from "../../ts/discover/app_page_discover_token_sort_options";
import { HUGGIES_APP_PAGE_DISCOVER_STORE } from "../../ts/discover/app_page_discover_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { marked_token_ids_fun } from "../../ts/discover/app_page_discover_marked_tokens";
import { huggies_token_list_fun } from "../shared/token_list";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_APP_PAGE_DISCOVER_TOKEN_DISCOVER_FUN() {
  const [sort, set_sort] = use_state<HUGGIES_TOKEN_SORT>(
    HUGGIES_DEFAULT_TOKEN_SORT,
  );
  const [direction, set_direction] = use_state<HUGGIES_TOKEN_SORT_DIRECTION>(
    HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION,
  );

  const page_data = use_page_store_fun(HUGGIES_APP_PAGE_DISCOVER_STORE);

  // --- WHY --- the page's start script loads the list with the default
  // sort. this effect is for the reader's OWN choices: when they pick a
  // different sort, the list is loaded again with it. the store ignores a
  // load for a sort that is already loaded, so they do not fight.
  use_effect(() => {
    void HUGGIES_APP_PAGE_DISCOVER_STORE.load(sort, direction === "desc");
  }, [sort, direction]);

  const loading = HUGGIES_APP_PAGE_DISCOVER_STORE.is_loading();
  const searching_now = HUGGIES_APP_PAGE_DISCOVER_STORE.is_searching();

  // --- WHY --- THE ROWS ON SCREEN COME FROM THE STORE, NOT FROM THE
  // SEARCH BOX: the store holds the list rows and the search results
  // side by side, and the shared list asks for one of them. so the rows
  // are the search results while a search is on screen, and the list
  // pages otherwise.
  const tokens = use_memo(() => {
    if (page_data?.search !== null && page_data?.search !== undefined) {
      return page_data.search;
    }
    const rows = page_data?.token_list.rows ?? [];
    return order_discover_tokens_fun(rows, sort);
  }, [page_data, sort]);

  // the icons for the rows on screen, filled in from the store.
  const icons = page_data?.icons ?? {};

  // the marked tokens are styled wherever the sort puts them.
  const marked_ids = marked_token_ids_fun();
  const errors = page_data?.errors ?? [];

  return (
    <>
      {huggies_token_list_fun({
        tokens: tokens.map((token) => ({
          ...token,
          icon: icons[token.id] ?? token.icon,
        })),
        marked_ids: marked_ids,
        on_search: (query) => {
          void HUGGIES_APP_PAGE_DISCOVER_STORE.search(query);
        },
        on_clear: () => {
          void HUGGIES_APP_PAGE_DISCOVER_STORE.clear_search();
        },
        loading: loading,
        searching: searching_now,
        sort: sort,
        direction: direction,
        on_sort: (next) => set_sort(next),
        on_direction: (next) => set_direction(next),
        has_more: page_data?.token_list.has_more ?? false,
        on_load_more: () => {
          void HUGGIES_APP_PAGE_DISCOVER_STORE.load_more(
            sort,
            direction === "desc",
          );
        },
        errors: errors,
      })}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_APP_PAGE_DISCOVER_TOKEN_DISCOVER;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<HUGGIES_COMPONENT_APP_PAGE_DISCOVER_TOKEN_DISCOVER_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
