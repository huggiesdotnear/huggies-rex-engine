// ========================================
// the swap page's first load.
//
// it runs before the components mount, so the pair from the url and
// their balances are on the way before anything is drawn.
//
// --- WHY IT CALLS THE LOADING BAR FIRST: the bar patches the global
// fetch, and the patch has to be in place before the page's first
// request — otherwise the page's own first load was never counted and
// the bar sat dark through it.
import { shit_1170_loading_bar_start_fun } from "../shared/loading_bar_start";
import { SHIT_1170_APP_PAGE_SWAP_STORE } from "./app_page_swap_store";
// ========================================
shit_1170_loading_bar_start_fun();
// ========================================
// the page's first load: the pair from the url, their info, their
// balances and the first quote.
void SHIT_1170_APP_PAGE_SWAP_STORE.load();
// ========================================
// copyright 2026 by sleet.near
// ========================================
