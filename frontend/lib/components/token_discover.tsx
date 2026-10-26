// ========================================
// searchable token list for the discover page.
// ========================================
import { render } from "preact";
import { useEffect as use_effect, useMemo as use_memo, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import {
  fetch_all_tokens_fun,
  search_tokens_fun,
  type HUGGIES_TOKEN_SEARCH_RESULT,
} from "../ts/token_search";
import { token_detail_href_fun } from "../ts/token_link";
import { order_discover_tokens_fun } from "../ts/token_discover_order";
import {
  HUGGIES_DEFAULT_TOKEN_SORT,
  HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION,
  token_sort_field_fun,
  type HUGGIES_TOKEN_SORT,
  type HUGGIES_TOKEN_SORT_DIRECTION,
} from "../ts/token_sort";
import {
  get_cached_token_set_fun,
  put_cached_token_set_fun,
} from "../ts/token_list_cache";
import { fetch_token_icons_fun } from "../ts/token_icon_fetch";
import { pinned_token_ids_fun } from "../ts/pinned_tokens";
import { huggies_sort_control_fun } from "./sort_control";
// ========================================
// how long to wait after a keystroke before asking the api. long
// enough that typing a word is one request, not one per letter.
const HUGGIES_SEARCH_DEBOUNCE_MS = 250;
// how many token rows are on screen at once. the list scrolls, so this
// is how many icons get fetched for it. it is well above one batch:
// the api's url limit decides how many ids fit in a single request
// (see token_icon_fetch.ts), so the visible list spans a few batches.
const HUGGIES_VISIBLE_ROWS = 300;
// ========================================
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
// searchable token list component.
export function HUGGIES_COMPONENT_TOKEN_DISCOVER_FUN() {
  const [all_tokens, set_all_tokens] = use_state<
    HUGGIES_TOKEN_SEARCH_RESULT[] | null
  >(null);
  const [query, set_query] = use_state("");
  const [sort, set_sort] = use_state<HUGGIES_TOKEN_SORT>(
    HUGGIES_DEFAULT_TOKEN_SORT,
  );
  const [direction, set_direction] = use_state<HUGGIES_TOKEN_SORT_DIRECTION>(
    HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION,
  );
  const [error, set_error] = use_state<string | null>(null);

  // --- WHY --- the whole indexed token set is fetched once and cached
  // in indexeddb, rather than one page per sort. sorting happens in
  // javascript, so a cached copy per sort field would store the same
  // 7.4k rows several times over for nothing, and a truncated top-N
  // list could never show the smallest token in an ascending sort.
  use_effect(() => {
    let cancelled = false;
    set_error(null);
    void get_cached_token_set_fun()
      .then((cached) => {
        if (cached !== null) {
          if (!cancelled) set_all_tokens(cached);
          return cached;
        }
        return fetch_all_tokens_fun().then((rows) => {
          if (cancelled) return rows;
          set_all_tokens(rows);
          void put_cached_token_set_fun(rows);
          return rows;
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        set_error(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // --- WHY --- a search asks the api, not the downloaded list. the api
  // has a real search index behind it; filtering a downloaded list in
  // javascript only sees the tokens we happened to download, so a
  // token outside that set was unfindable however the reader typed.
  const [search_rows, set_search_rows] = use_state<
    HUGGIES_TOKEN_SEARCH_RESULT[] | null
  >(null);
  const [searching, set_searching] = use_state(false);
  use_effect(() => {
    const needle = query.trim();
    if (needle.length === 0) {
      set_search_rows(null);
      set_searching(false);
      return;
    }
    let cancelled = false;
    set_searching(true);
    const timer = window.setTimeout(() => {
      void search_tokens_fun(needle)
        .then((rows) => {
          if (cancelled) return;
          set_search_rows(rows);
          set_searching(false);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          set_searching(false);
          console.warn("[token_discover] search failed", err);
        });
    }, HUGGIES_SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  // --- WHY --- useMemo, not a plain const. the sorted list is the
  // dependency of the icon effect below, and a plain const builds a
  // NEW array on every render — so the effect re-fired on every
  // render and fetched icons in the background forever. useMemo keeps
  // the same array identity while the inputs are unchanged, so the
  // effect only runs when the list actually changes.
  const tokens = use_memo(() => {
    if (search_rows !== null) return search_rows;
    if (all_tokens === null) return null;
    return order_discover_tokens_fun(all_tokens, sort, direction);
  }, [search_rows, all_tokens, sort, direction]);

  // --- WHY --- icons are fetched only for the rows on screen, and
  // cached in the durable per-token store. asking for the icon field
  // on every indexed token costs ~21MB, because each icon is a full
  // base64 data uri.
  const visible_ids = use_memo(() => {
    if (tokens === null) return [];
    return tokens.slice(0, HUGGIES_VISIBLE_ROWS).map((token) => token.id);
  }, [tokens]);
  // the page of tokens the api should return the icons for. the api
  // can serve a sorted page with no ids in the url at all, which is
  // far cheaper than carrying a list of ids.
  const icon_sort = use_memo(() => {
    if (search_rows !== null) return undefined;
    return {
      by: token_sort_field_fun(sort),
      desc: direction === "desc",
    };
  }, [search_rows, sort, direction]);
  const [icons, set_icons] = use_state<Record<string, string>>({});
  use_effect(() => {
    if (visible_ids.length === 0) return;
    let cancelled = false;
    void fetch_token_icons_fun(visible_ids, icon_sort)
      .then((found) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const [id, icon] of found) next[id] = icon;
        set_icons(next);
      })
      .catch((err: unknown) => {
        console.warn("[token_discover] icon fetch failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, [visible_ids, icon_sort]);

  const rows = tokens === null ? null : tokens.map((token) => ({
    ...token,
    icon: icons[token.id] ?? token.icon,
  }));
  // the marked tokens are styled wherever the sort puts them.
  const marked_ids = pinned_token_ids_fun();

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
      {error !== null && <p>{error}</p>}
      {searching && <p class="huggies-token-searching">SEARCHING...</p>}
      {rows === null ? (
        <p>LOADING TOKENS...</p>
      ) : rows.length === 0 ? (
        <p>NO TOKENS FOUND</p>
      ) : (
        <div class="huggies-token-results">
          {rows.map((token) =>
            token_result_row_fun(token, marked_ids.has(token.id)),
          )}
        </div>
      )}
    </section>
  );
}
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
