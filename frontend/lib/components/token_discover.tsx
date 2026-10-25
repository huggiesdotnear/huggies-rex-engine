// ========================================
// searchable token list for the discover page.
// ========================================
import { render } from "preact";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import {
  fetch_initial_tokens_fun,
  search_tokens_fun,
  type HUGGIES_TOKEN_SEARCH_RESULT,
} from "../ts/token_search";
import { token_detail_href_fun } from "../ts/token_link";
import { HUGGIES_COMPONENT_EMOJI_SPOTLIGHT_FUN } from "./emoji_spotlight";
// ========================================
const HUGGIES_TOKEN_SEARCH_DELAY_MS = 350;
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
        <span>${token.price_usd.toLocaleString()}</span>
        <span>{token.holders.toLocaleString()} holders</span>
      </span>
    </a>
  );
}
// ========================================
// searchable token list component.
function HUGGIES_COMPONENT_TOKEN_DISCOVER_FUN() {
  const [tokens, set_tokens] = use_state<HUGGIES_TOKEN_SEARCH_RESULT[] | null>(
    null,
  );
  const [query, set_query] = use_state("");
  const [error, set_error] = use_state<string | null>(null);

  use_effect(() => {
    let cancelled = false;
    void fetch_initial_tokens_fun()
      .then((rows) => {
        if (!cancelled) set_tokens(rows);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        set_error(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  use_effect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void search_tokens_fun(trimmed)
        .then((rows) => {
          if (!cancelled) set_tokens(rows);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          set_error(err instanceof Error ? err.message : String(err));
        });
    }, HUGGIES_TOKEN_SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const on_input_fun = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    set_query(target.value);
    if (target.value.trim().length === 0) {
      void fetch_initial_tokens_fun()
        .then((rows) => set_tokens(rows))
        .catch((err: unknown) => {
          set_error(err instanceof Error ? err.message : String(err));
        });
    }
  };

  return (
    <section class="huggies-token-discover">
      {/* the emojifi spotlight sits above the general token list. */}
      <HUGGIES_COMPONENT_EMOJI_SPOTLIGHT_FUN />
      <label class="huggies-token-search">
        <span>SEARCH TOKENS</span>
        <input
          type="search"
          value={query}
          placeholder="name or symbol"
          onInput={on_input_fun}
        />
      </label>
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
