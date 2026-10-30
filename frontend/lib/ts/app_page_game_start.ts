// ========================================
// the game page's start: it begins the page's load.
//
// the page's html loads this script, so the load starts as soon as
// the page is parsed — before the components mount.
//
// --- WHY --- a script and not a component: a component that called
// the load would be doing two jobs — displaying and starting the
// page's work.
//
// --- WHY --- the store owns the load and this file only asks for it:
// the fetching itself lives in lib/ts/app_page_game.ts, so the page's
// request list is still knowable by reading one file.
//
// --- WHY --- the game page has no id to watch: there is nothing in the
// url to read and no account to sign in. the meme tokens are a
// constant, so the store has nothing to watch.
import { HUGGIES_APP_PAGE_GAME_STORE } from "./app_page_game_store";
// ========================================
// --- START -----------------------------
void HUGGIES_APP_PAGE_GAME_STORE.load();
// ========================================
// copyright 2026 by sleet.near
// ========================================
