// ========================================
// searchable token list for the discover page.
//
// this component does NOT fetch. the discover page has one loader
// (lib/ts/app_page_discover.ts) and this component reads its result
// from the page store (lib/ts/app_page_discover_store.ts). read that
// file to see what the discover page requests.
//
// the list is paged: the api sorts and paginates on its own, so the
// page asks for one page of rows at a time and asks for the next one
// when the reader scrolls to the bottom. mounts into
// <div id="HUGGIES_COMPONENT_TOKEN_DISCOVER">.
import { render } from "preact";
import {
  useEffect as use_effect,
  useMemo as use_memo,
  useRef as use_ref,
  useState as use_state,
} from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { token_detail_href_fun } from "../ts/token_link";
import { order_discover_tokens_fun } from "../ts/app_page_discover_token_order";
import {
  HUGGIES_DEFAULT_TOKEN_SORT,
  HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION,
  type HUGGIES_TOKEN_SORT,
  type HUGGIES_TOKEN_SORT_DIRECTION,
} from "../ts/app_page_discover_token_sort";
import { HUGGIES_APP_PAGE_DISCOVER_STORE } from "../ts/app_page_discover_store";
import { pinned_token_ids_fun } from "../ts/app_page_discover_pinned_tokens";
import { huggies_sort_control_fun } from "./sort_control";
import type { HUGGIES_TOKEN_SEARCH_RESULT } from "../ts/app_page_discover_token_result";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how long to wait after a keystroke before asking the api. long
// enough that typing a word is one request, not one per letter.
const HUGGIES_SEARCH_DEBOUNCE_MS = 250;
// how close to the bottom of the list the reader has to scroll before
// the next page is asked for. a little early, so the next page is
// usually already there by the time they reach the end.
const HUGGIES_LOAD_MORE_THRESHOLD_PX = 600;
// ========================================
// ========================================
// --- ROW -------------------------------
// render one token result as a link to its detail page.
function token_result_row_fun(
  token: HUGGIES_TOKEN_SEARCH_RESULT,
  marked: boolean,
): preact.JSX.Element {
  const row_class = marked
    ? "huggies-token-result is-marked"
    : "huggies-token-result";
  return (
    <a class={row_class} href={token_detail_href_fun(token.id)}>
      {token.icon !== null ? (
        <img class="huggies-token-result-icon" src={token.icon} alt="" />
      ) : (
        <span class="huggies-token-result-icon is-empty" />
      )}
      <span class="huggies-token-result-copy">
        <strong>{token.symbol}</strong>
        <span>{token.name}</span>
        <code>{token.id}</code>
      </span>
      <span class="huggies-token-result-values">
        <span>${token.volume_usd_24h.toLocaleString()} VOL</span>
        <span>${token.market_cap_usd.toLocaleString()} MCAP</span>
      </span>
    </a>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_TOKEN_DISCOVER_FUN() {
  const [, set_revision] = use_state(0);
  const [query, set_query] = use_state("");
  const [sort, set_sort] = use_state<HUGGIES_TOKEN_SORT>(
    HUGGIES_DEFAULT_TOKEN_SORT,
  );
  const [direction, set_direction] = use_state<HUGGIES_TOKEN_SORT_DIRECTION>(
    HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION,
  );
  // the scroll container, so the reader's position at the bottom can
  // be detected.
  const scroll_ref = use_ref<HTMLDivElement | null>(null);

  // the page store owns the load. this component starts it once and
  // re-renders when it lands.
  use_effect(() => {
    const unsubscribe = HUGGIES_APP_PAGE_DISCOVER_STORE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    void HUGGIES_APP_PAGE_DISCOVER_STORE.load(sort, direction === "desc");
    return unsubscribe;
  }, [sort, direction]);

  // --- WHY --- a search asks the api, not the loaded page. the api has
  // a real search index behind it; filtering a loaded list in
  // javascript only sees the tokens we happened to load, so a token
  // outside that page was unfindable however the reader typed.
  //
  // --- WHY --- clearing the box goes back to the list. the search
  // results and the list rows are held side by side, so the list is
  // still there to show the moment the reader stops typing.
  use_effect(() => {
    const needle = query.trim();
    if (needle.length === 0) {
      void HUGGIES_APP_PAGE_DISCOVER_STORE.clear_search();
      return;
    }
    const timer = window.setTimeout(() => {
      void HUGGIES_APP_PAGE_DISCOVER_STORE.search(needle);
    }, HUGGIES_SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const page_data = HUGGIES_APP_PAGE_DISCOVER_STORE.get_data();
  const loading = HUGGIES_APP_PAGE_DISCOVER_STORE.is_loading();
  const searching_now = HUGGIES_APP_PAGE_DISCOVER_STORE.is_searching();
  const searching = query.trim().length > 0;

  // the rows on screen: the search results when the reader is
  // searching, the list pages otherwise.
  const tokens = use_memo(() => {
    if (searching) return page_data?.search ?? [];
    const rows = page_data?.tokens.rows ?? [];
    return order_discover_tokens_fun(rows, sort);
  }, [searching, page_data, sort, direction]);

  // the icons for the rows on screen, filled in from the store.
  const icons = page_data?.icons ?? {};

  // --- WHY --- the next page is asked for when the reader nears the
  // bottom of the list, not when they reach it exactly: the request
  // takes a moment, and asking early means the rows are usually
  // already there by the time they scroll to them.
  const has_more = page_data?.tokens.has_more ?? false;
  use_effect(() => {
    if (searching || !has_more || loading) return;
    const element = scroll_ref.current;
    if (element === null) return;
    const on_scroll_fun = (): void => {
      const distance =
        element.scrollHeight - element.scrollTop - element.clientHeight;
      if (distance > HUGGIES_LOAD_MORE_THRESHOLD_PX) return;
      void HUGGIES_APP_PAGE_DISCOVER_STORE.load_more(sort, direction === "desc");
    };
    element.addEventListener("scroll", on_scroll_fun);
    return () => {
      element.removeEventListener("scroll", on_scroll_fun);
    };
  }, [searching, has_more, loading, sort, direction]);

  // the marked tokens are styled wherever the sort puts them.
  const marked_ids = pinned_token_ids_fun();
  const errors = page_data?.errors ?? [];

  return (
    <section class="huggies-token-discover">
      <div class="huggies-token-discover-controls">
        <label class="huggies-token-search">
          <span>SEARCH TOKENS</span>
          <input
            type="search"
            value={query}
            placeholder="name or symbol"
            onInput={(event) => {
              set_query((event.currentTarget as HTMLInputElement).value);
            }}
          />
        </label>
        <div class="huggies-token-discover-sort">
          {huggies_sort_control_fun({
            sort,
            direction,
            on_sort: (next) => set_sort(next),
            on_direction: (next) => set_direction(next),
          })}
        </div>
      </div>
      {errors.map((message) => (
        <p class="huggies-token-error">{message}</p>
      ))}
      <div class="huggies-token-results-scroll" ref={scroll_ref}>
        {tokens.length === 0 && !loading && !searching_now ? (
          <p>NO TOKENS FOUND</p>
        ) : (
          <div class="huggies-token-results">
            {tokens.map((token) =>
              token_result_row_fun(
                { ...token, icon: icons[token.id] ?? token.icon },
                marked_ids.has(token.id),
              ),
            )}
          </div>
        )}
        {searching_now && (
          <p class="huggies-token-loading">SEARCHING...</p>
        )}
        {loading && !searching_now && (
          <p class="huggies-token-loading">LOADING TOKENS...</p>
        )}
        {!searching && has_more && !loading && (
          <p class="huggies-token-loading">SCROLL FOR MORE...</p>
        )}
      </div>
    </section>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TOKEN_DISCOVER;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_TOKEN_DISCOVER_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
