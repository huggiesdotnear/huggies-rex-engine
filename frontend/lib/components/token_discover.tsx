// ========================================
// searchable token list for the discover page.
// ========================================
import { render } from "preact";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import {
  fetch_initial_tokens_fun,
  type HUGGIES_TOKEN_SEARCH_RESULT,
} from "../ts/token_search";
import { token_detail_href_fun } from "../ts/token_link";
import { order_discover_tokens_fun } from "../ts/token_discover_order";
import {
  HUGGIES_DEFAULT_TOKEN_SORT,
  type HUGGIES_TOKEN_SORT,
} from "../ts/token_sort";
import {
  get_cached_token_list_fun,
  put_cached_token_list_fun,
} from "../ts/token_list_cache";
import { huggies_sort_control_fun } from "./sort_control";
// ========================================
// render one token result as a link to its detail page.
function token_result_row_fun(
  token: HUGGIES_TOKEN_SEARCH_RESULT,
): preact.JSX.Element {
  return (
    <a class="huggies-token-result" href={token_detail_href_fun(token.id)}>
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
// filter the cached list by a search query.
function filter_tokens_fun(
  tokens: ReadonlyArray<HUGGIES_TOKEN_SEARCH_RESULT>,
  query: string,
): HUGGIES_TOKEN_SEARCH_RESULT[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return [...tokens];
  return tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(needle) ||
      token.name.toLowerCase().includes(needle) ||
      token.id.toLowerCase().includes(needle),
  );
}
// ========================================
// searchable token list component.
function HUGGIES_COMPONENT_TOKEN_DISCOVER_FUN() {
  const [all_tokens, set_all_tokens] = use_state<
    HUGGIES_TOKEN_SEARCH_RESULT[] | null
  >(null);
  const [query, set_query] = use_state("");
  const [sort, set_sort] = use_state<HUGGIES_TOKEN_SORT>(
    HUGGIES_DEFAULT_TOKEN_SORT,
  );
  const [error, set_error] = use_state<string | null>(null);

  use_effect(() => {
    let cancelled = false;
    set_error(null);
    // --- WHY --- the list is cached in indexeddb, so a revisit shows
    // it instantly and the search filters that cached copy locally
    // instead of asking the api on every keystroke.
    void get_cached_token_list_fun(sort)
      .then((cached) => {
        if (cached !== null && !cancelled) {
          set_all_tokens(cached);
          return;
        }
        return fetch_initial_tokens_fun(sort).then((rows) => {
          if (cancelled) return;
          set_all_tokens(rows);
          void put_cached_token_list_fun(sort, rows);
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        set_error(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [sort]);

  const tokens =
    all_tokens === null
      ? null
      : order_discover_tokens_fun(filter_tokens_fun(all_tokens, query), sort);

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
        {huggies_sort_control_fun({
          sort,
          on_sort: (next) => set_sort(next),
        })}
      </div>
      {error !== null && <p>{error}</p>}
      {tokens === null ? (
        <p>LOADING TOKENS...</p>
      ) : tokens.length === 0 ? (
        <p>NO TOKENS FOUND</p>
      ) : (
        <div class="huggies-token-results">
          {tokens.map((token) => token_result_row_fun(token))}
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
