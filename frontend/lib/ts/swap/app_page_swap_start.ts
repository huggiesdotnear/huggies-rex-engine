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
import { huggies_loading_bar_start_fun } from "../shared/loading_bar_start";
import { HUGGIES_APP_PAGE_SWAP_STORE } from "./app_page_swap_store";
import { HUGGIES_APP_PAGE_SWAP_POSITIONS_STORE } from "./app_page_swap_positions_store";
// ========================================
huggies_loading_bar_start_fun();
// ========================================
// the page's first load: the pair from the url, their info, their
// balances and the first quote.
void HUGGIES_APP_PAGE_SWAP_STORE.load();
// ========================================
// the positions, and the watch on the auth state.
//
// --- WHY THE WATCH IS SET UP HERE AND NOT IN THE COMPONENT: the
// component only displays, and a component that watched the auth
// state would load twice when two components needed it. the watch
// belongs to the page's start, with the rest of the page's loading.
//
// --- WHY THE LOAD IS CALLED TOO: the watch only fires on a CHANGE,
// and the reader is often already signed in when the page opens — so
// the watch would never fire and the positions would never load.
HUGGIES_APP_PAGE_SWAP_POSITIONS_STORE.watch();
void HUGGIES_APP_PAGE_SWAP_POSITIONS_STORE.load();
// ========================================
// copyright 2026 by sleet.near
// ========================================
