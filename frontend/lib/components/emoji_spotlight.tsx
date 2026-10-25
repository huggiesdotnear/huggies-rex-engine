// ========================================
// the emojifi spotlight on the discover page: the meme token list
// from the emojifi project, fetched live and shown above the general
// token list.
// ========================================
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { token_detail_href_fun } from "../ts/token_link";
import { fetch_emoji_spotlight_fun } from "../ts/emoji_spotlight_fetch";
import type { HUGGIES_EMOJI_SPOTLIGHT_TOKEN } from "../ts/emoji_spotlight_fetch";
// ========================================

// ========================================
// --- ROW -------------------------------
// render one spotlight token as a link to its detail page.
function emoji_spotlight_row_fun(
  token: HUGGIES_EMOJI_SPOTLIGHT_TOKEN,
): preact.JSX.Element {
  return (
    <a
      class="huggies-emoji-spotlight-row"
      href={token_detail_href_fun(token.token_id)}
    >
      <span class="huggies-emoji-spotlight-emoji">{token.emoji}</span>
      {token.icon !== null ? (
        <img class="huggies-emoji-spotlight-icon" src={token.icon} alt="" />
      ) : (
        <span class="huggies-emoji-spotlight-icon is-empty" />
      )}
      <span class="huggies-emoji-spotlight-copy">
        <strong>{token.symbol}</strong>
        <span>{token.label}</span>
        <code>{token.token_id}</code>
      </span>
      <span class="huggies-emoji-spotlight-values">
        <span>${token.price_usd.toLocaleString()}</span>
        <span>{token.holders.toLocaleString()} holders</span>
      </span>
    </a>
  );
}
// ========================================
// --- COMPONENT --------------------------
// the spotlight block, with its own fetch and its own error state so
// a failed spotlight never takes the general token list down with it.
export function HUGGIES_COMPONENT_EMOJI_SPOTLIGHT_FUN() {
  const [tokens, set_tokens] =
    use_state<ReadonlyArray<HUGGIES_EMOJI_SPOTLIGHT_TOKEN> | null>(null);
  const [error, set_error] = use_state<string | null>(null);

  use_effect(() => {
    let cancelled = false;
    void fetch_emoji_spotlight_fun()
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

  if (error !== null) return null;
  if (tokens === null) return null;
  if (tokens.length === 0) return null;

  return (
    <section class="huggies-emoji-spotlight">
      <h2 class="huggies-emoji-spotlight-title">EMOJI SPOTLIGHT</h2>
      <div class="huggies-emoji-spotlight-list">
        {tokens.map((token) => emoji_spotlight_row_fun(token))}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// the spotlight renders inside the discover component, so it has no
// self-mount of its own.
// ========================================
// copyright 2026 by sleet.near
// ========================================
