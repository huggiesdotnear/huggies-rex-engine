// ========================================
// the queue page's first load.
//
// it runs before the components mount, so the batch the url names is on
// the way before anything is drawn.
//
// --- WHY IT CALLS THE LOADING BAR FIRST: the bar patches the global
// fetch, and the patch has to be in place before the page's first
// request — otherwise the page's own first load was never counted and
// the bar sat dark through it.
import { shit_1170_loading_bar_start_fun } from "../shared/loading_bar_start";
import { SHIT_1170_APP_PAGE_QUEUE_STORE } from "./app_page_queue_store";
// ========================================
shit_1170_loading_bar_start_fun();
// ========================================
// the auth is watched so the reader's status on the batch follows a
// sign-in or a sign-out.
SHIT_1170_APP_PAGE_QUEUE_STORE.watch();
// ========================================
// the page's first load: the batch the url names.
void SHIT_1170_APP_PAGE_QUEUE_STORE.load();
// ========================================
// copyright 2026 by sleet.near
// ========================================
