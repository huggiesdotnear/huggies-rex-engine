// ========================================
// the meme tokens the game is played with, as a list of rounded cards.
//
// one card per meme token: its emoji, its label and its token id, each
// card linking to that token's page.
//
// this component does not fetch. it reads the page's store and renders.
// ========================================
import { render } from "preact";
import { HUGGIES_EMOJI_TOKENS } from "../ts/app_page_game_emoji_tokens";
import { token_detail_href_fun } from "../ts/token_link";
import { HUGGIES_APP_PAGE_GAME_STORE } from "../ts/app_page_game_store";
import { use_page_store_fun } from "../ts/use_page_store";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
// ========================================
// the meme tokens the game page shows.
function HUGGIES_COMPONENT_GAME_MEME_TOKENS_FUN() {
  // the page's icons, by token id. the store owns the load, so this
  // component only reads.
  const page_data = use_page_store_fun(HUGGIES_APP_PAGE_GAME_STORE);
  const icons = page_data?.icons ?? {};

  return (
    <section class="huggies-meme-tokens">
      <h2>MEME TOKENS</h2>
      <ul class="huggies-meme-tokens-list">
        {HUGGIES_EMOJI_TOKENS.map((token) => {
          const icon =
            token.token_id === null ? null : (icons[token.token_id] ?? null);
          return (
            <li class="huggies-meme-tokens-item">
              <a
                class="huggies-meme-tokens-card"
                href={
                  token.token_id !== null
                    ? token_detail_href_fun(token.token_id)
                    : "https://meme.cooking/"
                }
                {...(token.token_id === null
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                <span class="huggies-meme-tokens-emoji">{token.emoji}</span>
                <span class="huggies-meme-tokens-body">
                  <strong class="huggies-meme-tokens-label">
                    {token.label}
                  </strong>
                  <code class="huggies-meme-tokens-id">
                    {token.token_id ?? "meme.cooking"}
                  </code>
                </span>
                {icon !== null && (
                  <img class="huggies-meme-tokens-icon" src={icon} alt="" />
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_GAME_MEME_TOKENS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_GAME_MEME_TOKENS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
