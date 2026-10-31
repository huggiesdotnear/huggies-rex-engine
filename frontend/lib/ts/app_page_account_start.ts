// ========================================
// the account page's start: it begins the page's load.
//
// the page's html loads this script, so the load starts as soon as the page
// is parsed — before the components mount.
//
// --- WHY --- a script and not a component: the four balance tables used
// to each call the store's load() from their own effect. four components
// asking for the same page's data is four chances to start the same load,
// and it hides WHICH component the page depends on.
//
// --- WHY --- the store owns the load and this file only asks for it: the
// fetching itself lives in lib/ts/app_page_account.ts, so the page's request
// list is still knowable by reading one file.
//
// --- WHY --- the account id comes from the url: the page shows the account
// named by `?id=`, and the components read it from the same place.
import { HUGGIES_APP_PAGE_ACCOUNT_ID } from "./app_page_account_id";
import { HUGGIES_APP_PAGE_ACCOUNT_STORE } from "./app_page_account_store";
import { huggies_loading_bar_start_fun } from "./page_loading_bar_start";
// ========================================
// ========================================
// --- START -----------------------------
// the loading bar's patch goes in before the page's first request.
huggies_loading_bar_start_fun();
// begin the page's load for the account the url names, and watch the
// id so a later change reloads the page by itself.
HUGGIES_APP_PAGE_ACCOUNT_ID.init();
HUGGIES_APP_PAGE_ACCOUNT_STORE.watch();
void HUGGIES_APP_PAGE_ACCOUNT_STORE.load();
// ========================================
// copyright 2026 by sleet.near
// ========================================
