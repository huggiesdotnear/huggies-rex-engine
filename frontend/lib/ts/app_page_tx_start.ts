// ========================================
// the transaction page's start: it begins the page's load.
//
// the page's html loads this script, so the load starts as soon as the
// page is parsed — before the components mount.
//
// --- WHY --- a script and not a component: a component that called the
// load would be doing two jobs — displaying and starting the page's
// work.
//
// --- WHY --- the store owns the load and this file only asks for it:
// the fetching itself lives in lib/ts/app_page_tx.ts, so the page's
// request list is still knowable by reading one file.
import { HUGGIES_APP_PAGE_TX_STORE } from "./app_page_tx_store";
import { huggies_loading_bar_start_fun } from "./page_loading_bar_start";
// ========================================
// ========================================
// --- START -----------------------------
// the loading bar's patch goes in before the page's first request.
huggies_loading_bar_start_fun();
// begin the page's load for the transaction the url names.
void HUGGIES_APP_PAGE_TX_STORE.load();
// ========================================
// copyright 2026 by sleet.near
// ========================================
