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
// --- WHY THE AUTH IS WATCHED: the reader's own account is in play for
// the hide-sent filter and for the ME button in the accounts group, so
// a sign-in or a sign-out has to move the feed. the store owns the
// subscription.
const unsubscribe = SHIT_1170_APP_PAGE_FEED_STORE.watch();
// ========================================
// --- WHY THE PAGE CLOSES THE LIVE FEED WHEN IT GOES AWAY: the feed
// holds one socket, and a socket that is left open keeps pushing
// events into a page that is no longer there — and the middleman keeps
// reconnecting it. so the page lets go of it on the way out.
//
// --- WHY IT IS `beforeunload` AND NOT SOMETHING ELSE: the feed page
// is a whole page, not a piece of a page, so the browser firing the
// unload event IS the page going away. it is the same rule the auth
// redirect page follows for its own subscription.
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    unsubscribe();
    SHIT_1170_APP_PAGE_FEED_STORE.close();
  });
}
// ========================================
// the page's first load.
void SHIT_1170_APP_PAGE_FEED_STORE.load();
// ========================================
// copyright 2026 by sleet.near
// ========================================
