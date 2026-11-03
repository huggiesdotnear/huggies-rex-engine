// ========================================
// the skill page's start: it begins the page's load.
//
// the page's import file pulls this in, so the load starts before the
// components mount.
//
// --- WHY --- a script and not a component: the card used to call the
// store's load() from its own effect, which hid WHICH component the
// page depends on and made a second mount start a second load.
//
// --- WHY --- the store watches the auth state: the signed accounts can
// change under the page — the reader signs in, signs out, or removes an
// account — and the card has to follow by itself.
import { SHIT_1170_APP_PAGE_SKILL_SESSION_STORE } from "./app_page_skill_session_store";
import { shit_1170_loading_bar_start_fun } from "../shared/loading_bar_start";
// ========================================
// ========================================
// --- START -----------------------------
// the loading bar's patch goes in before the page's first request.
shit_1170_loading_bar_start_fun();
// the card follows the signed accounts, so the store watches the auth
// state and reloads by itself when an account comes or goes.
SHIT_1170_APP_PAGE_SKILL_SESSION_STORE.watch();
// begin the page's load.
void SHIT_1170_APP_PAGE_SKILL_SESSION_STORE.load();
// ========================================
// copyright 2026 by sleet.near
// ========================================
