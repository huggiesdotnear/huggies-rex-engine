// ========================================
// the feed page's first load.
//
// it runs before the components mount, so the filter from the url and
// the batches it asks for are on the way before anything is drawn.
//
// --- WHY IT CALLS THE LOADING BAR FIRST: the bar patches the global
// fetch, and the patch has to be in place before the page's first
// request — otherwise the page's own first load was never counted and
// the bar sat dark through it.
import { shit_1170_loading_bar_start_fun } from "../shared/loading_bar_start";
import { SHIT_1170_APP_PAGE_FEED_STORE } from "./app_page_feed_store";
// ========================================
shit_1170_loading_bar_start_fun();
// ========================================
// the page's first load: the filter from the url, then the batches.
//
// --- WHY THE AUTH IS WATCHED: the default view depends on whether
// anybody is signed in, so a sign-in or a sign-out has to move the
// feed. the store owns the subscription.
SHIT_1170_APP_PAGE_FEED_STORE.watch();
// ========================================
// the page's first load.
void SHIT_1170_APP_PAGE_FEED_STORE.load();
// ========================================
// copyright 2026 by sleet.near
// ========================================
