// ========================================
// the shared token list: the search box, the sort row, the rows and the
// scroll paging, in one piece.
//
// it is used by more than one page — the discover page's token list and
// the swap page's token picker — so it lives in shared/.
//
// --- WHY --- THE DISCOVER PAGE'S LIST AND THE SWAP PICKER ARE THE SAME
// THING: both are a searchable list of tokens, and both were written
// twice. the picker was a hand-made copy of the discover list: its own
// row shape, its own css class names, its own idea of what a token row
// carries. so a token looked one way on the discover page and another
// way in the picker, and a change to the list had to be made in two
// places. one list, used twice, is the only way the two can stay the
// same.
//
// --- WHY --- IT DOES NOT FETCH AND DOES NOT SELF-MOUNT: it renders what
// it is given. the discover page's rows come from the discover store and
// the picker's rows come from the picker's own store, and the two stores
// are different because the two pages ask for different things — the
// discover list pages the whole token index, the picker asks for the
// most liquid fifty and then searches. the list does not care which
// one it is drawing.
//
// --- WHY --- THE ROW IS A LINK ON ONE PAGE AND A BUTTON ON THE OTHER:
// on the discover page a row OPENS the token's page. in the picker a row
// PICKS the token. so the caller says which, with the `on_pick` prop:
// no `on_pick` means the row is a link to the token's page, and an
// `on_pick` means the row is a button that calls it.
import {
  useEffect as use_effect,
  useMemo as use_memo,
  useRef as use_ref,
  useState as use_state,
} from "preact/hooks";
import { huggies_sort_keys_control_fun } from "./sort_keys_control";
import { token_detail_href_fun } from "../../ts/shared/token_link";
import { use_scroll_load_fun } from "../../ts/shared/use_scroll_load";
import {
  HUGGIES_TOKEN_SORTS,
  type HUGGIES_TOKEN_SORT,
  type HUGGIES_TOKEN_SORT_DIRECTION,
} from "../../ts/discover/app_page_discover_token_sort_options";
import type { HUGGIES_DISCOVER_TOKEN_ROW } from "../../ts/discover/app_page_discover_token_row";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how long to wait after a keystroke before asking the api. long enough
// that typing a word is one request, not one per letter.
const HUGGIES_TOKEN_LIST_SEARCH_DEBOUNCE_MS = 250;
// the css selector that matches ONE row of the list. the rows are
// links or buttons, not table rows, so the scroll hook is told what a
// row is.
const HUGGIES_TOKEN_LIST_ROW_SELECTOR = ".token-list-row";
// ========================================
// ========================================
// --- PROPS ------------------------------
// what the list draws.
export interface HUGGIES_TOKEN_LIST_PROPS {
  // the rows on screen.
  tokens: ReadonlyArray<HUGGIES_DISCOVER_TOKEN_ROW>;
  // the tokens the reader marked, so they can stand out wherever the
  // sort puts them.
  marked_ids?: ReadonlySet<string>;
  // the text the search box starts with.
  initial_query?: string;
  // called when the reader has typed something and the api has been
  // asked. it is called with the debounced, trimmed text.
  on_search: (query: string) => void;
  // called when the reader clears the search box. the list the reader
  // was looking at comes back on its own.
  on_clear: () => void;
  // true while the rows are being fetched.
  loading: boolean;
  // true while a SEARCH is running.
  searching: boolean;
  // the chosen sort key.
  sort: HUGGIES_TOKEN_SORT;
  // the chosen direction.
  direction: HUGGIES_TOKEN_SORT_DIRECTION;
  // called when the reader picks another sort key.
  on_sort: (sort: HUGGIES_TOKEN_SORT) => void;
  // called when the reader flips the direction.
  on_direction: (direction: HUGGIES_TOKEN_SORT_DIRECTION) => void;
  // true when the api has more rows behind this one.
  has_more: boolean;
  // called when the reader nears the bottom of the list.
  on_load_more: () => void;
  // when this is set, a row is a BUTTON that calls it with the token's
  // id. when it is not, a row is a LINK to the token's page.
  on_pick?: (token_id: string) => void;
  // the messages for the reader, when something failed.
  errors?: ReadonlyArray<string>;
  // the text on the empty row.
  empty_text?: string;
  // the text while a search is running.
  searching_text?: string;
  // the text while the list is loading.
  loading_text?: string;
  // the text under the list when there is another page.
  more_text?: string;
}
// ========================================
// ========================================
// --- ROW -------------------------------
// one token row: the icon, the symbol, the name, the id and the values.
//
// --- WHY --- THE VALUES ARE ON THE ROW: volume and market cap are what
// the reader compares, and the sort row changes which one leads. so
// they are on the row, under the token's name.
//
// --- WHY --- THE ID IS ON THE ROW: a near token id is long and the
// reader needs it to recognise a token they know, but it is the last
// thing on the row so it never pushes the symbol out of view.
function token_list_row_fun(
  token: HUGGIES_DISCOVER_TOKEN_ROW,
  marked: boolean,
  on_pick: ((token_id: string) => void) | undefined,
): preact.JSX.Element {
  const classes = ["token-list-row"];
  if (marked) classes.push("is-marked");
  const icon =
    token.icon !== null ? (
      <img class="token-list-icon" src={token.icon} alt="" />
    ) : (
      <span class="token-list-icon is-empty" />
    );
  const copy = (
    <span class="token-list-copy">
      <strong>{token.symbol}</strong>
      <span>{token.name}</span>
      <code>{token.id}</code>
    </span>
  );
  const values = (
    <span class="token-list-values">
      <span>${token.volume_usd_24h.toLocaleString()} VOL</span>
      <span>${token.market_cap_usd.toLocaleString()} MCAP</span>
    </span>
  );
  // --- WHY --- THE ROW IS A LINK OR A BUTTON AND NOT ONE ELEMENT WITH
  // A ROLE: a row that opens the token's page IS a link — it has a
  // href, it can be middle-clicked and it can be copied. a row that
  // PICKS the token IS a button — it acts on the page it is on. one
  // element with a role attribute would be neither, and would lose the
  // link's own affordances.
  if (on_pick !== undefined) {
    return (
      <button
        type="button"
        class={classes.join(" ")}
        onClick={() => on_pick(token.id)}
        title={token.name}
      >
        {icon}
        {copy}
        {values}
      </button>
    );
  }
  return (
    <a
      class={classes.join(" ")}
      href={token_detail_href_fun(token.id)}
      title={token.name}
    >
      {icon}
      {copy}
      {values}
    </a>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
// the list: the controls on top, the rows in a scroll box.
export function huggies_token_list_fun(
  props: HUGGIES_TOKEN_LIST_PROPS,
): preact.JSX.Element {
  // the scroll container, so the reader's position at the bottom is
  // detectable.
  const scroll_ref = use_ref<HTMLDivElement | null>(null);
  // the search box's own text. it lives HERE and not in the caller,
  // because the debounce belongs to the box: the list holds the raw
  // text and asks the api the debounced one.
  const [query, set_query] = use_state(props.initial_query ?? "");

  // --- WHY --- THE SEARCH IS DEBOUNCED HERE: the api has a real search
  // index behind it, so every keystroke is a request. the debounce makes
  // typing a word ONE request and not one per letter. it lives in the
  // shared list because both pages want it and neither should own the
  // rule for itself.
  use_effect(() => {
    const needle = query.trim();
    if (needle.length === 0) {
      props.on_clear();
      return;
    }
    const timer = window.setTimeout(() => {
      props.on_search(needle);
    }, HUGGIES_TOKEN_LIST_SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  // --- WHY --- THE NEXT PAGE IS ASKED FOR WHEN THE READER NEARS THE
  // BOTTOM OF THE LIST, not when they reach it exactly: the request
  // takes a moment, so asking early means the rows are usually there.
  use_scroll_load_fun(
    scroll_ref,
    props.has_more && !props.searching,
    props.loading,
    () => props.on_load_more(),
    HUGGIES_TOKEN_LIST_ROW_SELECTOR,
  );

  const errors = props.errors ?? [];
  const searching = query.trim().length > 0;
  const marked_ids = props.marked_ids;

  const rows = use_memo(() => {
    return props.tokens.map((token) =>
      token_list_row_fun(
        token,
        marked_ids?.has(token.id) ?? false,
        props.on_pick,
      ),
    );
  }, [props.tokens, marked_ids, props.on_pick]);

  return (
    <section class="token-list">
      <div class="controls">
        <div class="search">
          <input
            type="search"
            value={query}
            placeholder="name or symbol"
            onInput={(event) => {
              set_query((event.currentTarget as HTMLInputElement).value);
            }}
          />
        </div>
        <div class="sort">
          {huggies_sort_keys_control_fun({
            options: HUGGIES_TOKEN_SORTS,
            sort: props.sort,
            direction: props.direction,
            on_sort: (next) => props.on_sort(next),
            on_direction: (next) => props.on_direction(next),
          })}
        </div>
      </div>
      {errors.map((message) => (
        <p class="error">{message}</p>
      ))}
      <div class="results-scroll" ref={scroll_ref}>
        {rows.length === 0 && !props.loading && !props.searching ? (
          <p>{props.empty_text ?? "NO TOKENS FOUND"}</p>
        ) : (
          <div class="results">{rows}</div>
        )}
        {props.searching && (
          <p class="loading">{props.searching_text ?? "SEARCHING..."}</p>
        )}
        {props.loading && !props.searching && (
          <p class="loading">{props.loading_text ?? "LOADING TOKENS..."}</p>
        )}
        {!searching && props.has_more && !props.loading && (
          <p class="loading">{props.more_text ?? "SCROLL FOR MORE..."}</p>
        )}
      </div>
    </section>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
