// ========================================
// the game page's start: it begins the page's load.
//
// the page's html loads this script, so the load starts as soon as the
// page is parsed — before the components mount, and without any
// component having to ask for it.
//
// --- WHY --- a script and not a component: a component that called the
// load would be doing two jobs — displaying and starting the page's
// work — and it would be an arbitrary choice of which component does
// it. the page's html says when the page starts, so the html starts
// it.
//
// --- WHY --- the store owns the load and this file only asks for it:
// the fetching itself lives in lib/ts/app_page_game.ts, so the page's
// request list is still knowable by reading one file.
//
// --- WHY --- the game page has no id to watch: there is nothing in the
// url to read and no account to sign in. the meme tokens are a
// constant, so the page's data does not change under it and the store
// has nothing to watch.
import { HUGGIES_APP_PAGE_GAME_STORE } from "./app_page_game_store";
// ========================================
// --- START -----------------------------
// begin the page's load.
void HUGGIES_APP_PAGE_GAME_STORE.load();
// ========================================
// copyright 2026 by sleet.near
// ========================================
