// ========================================
// the game page's ONE load: every fetch the page makes happens here.
//
// read this file to know what the page requests.
//
// WHY this exists
// --- the game component used to fetch its own icons from inside its
// effect, through the full read-through token info path. that path asks
// for BOTH halves of a token: the durable half (symbol, decimals, icon
// hash) and the volatile half (price_usd, reputation, holders). the game
// shows none of the volatile half — it draws the icon on a card and the
// emoji beside it — so every visit paid for three numbers it threw away.
//
// one loader fixes that: the page asks for the icons and nothing else,
// through the same cache-first path the discover page uses, so a warm
// cache costs no request at all.
//
// WHAT THE PAGE REQUESTS
//   1. GET /tokens   the durable fields — symbol, decimals, icon_hash
//                    — for the tokens the durable cache does not already
//                    hold. skipped entirely on a warm cache.
//
// --- WHY --- the volatile fields are NOT requested: the page shows no
// price, no reputation and no holder count. the icon hash never changes
// for the life of a token, so it belongs with the durable half.
// ========================================
import { fetch_token_icons_fun } from "./app_page_discover_token_icons";
import { HUGGIES_EMOJI_TOKENS } from "./app_page_game_emoji_tokens";
// ========================================
// ========================================
// --- TYPES ------------------------------
// everything the game page has loaded.
export interface HUGGIES_APP_PAGE_GAME_DATA {
  // the token icons, by token id. a token with no icon is simply
  // absent, and its card falls back to the emoji.
  icons: Record<string, string>;
  // one message per thing that failed.
  errors: ReadonlyArray<string>;
}
// ========================================
// --- HELPERS ----------------------------
// --- WHY --- the meme-cooking entry is dropped: it is a dao and not a
// token, so it has no token id and no icon.
function game_token_ids_fun(): string[] {
  return HUGGIES_EMOJI_TOKENS.map((token) => token.token_id).filter(
    (token_id): token_id is string => token_id !== null,
  );
}
// ========================================
// --- LOAD -------------------------------
// --- WHY --- a failure here is not a broken page: the emoji IS the
// fallback, so a failed load leaves the game fully playable with the
// emoji alone. nothing on the board depends on the error.
async function app_page_game_load_fun(): Promise<HUGGIES_APP_PAGE_GAME_DATA> {
  const ids = game_token_ids_fun();
  if (ids.length === 0) return { icons: {}, errors: [] };
  try {
    const found = await fetch_token_icons_fun(ids);
    const icons: Record<string, string> = {};
    for (const [id, icon] of found) icons[id] = icon;
    return { icons, errors: [] };
  } catch (err) {
    return {
      icons: {},
      errors: [err instanceof Error ? err.message : String(err)],
    };
  }
}
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_GAME = {
  load: app_page_game_load_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
