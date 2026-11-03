// ========================================
// the discover page's start: it begins the page's load.
//
// the page's import file pulls this in, so the load starts before the
// components mount.
//
// --- WHY --- a script and not a component: a component that called the
// load would be doing two jobs — displaying and starting the page's
// work.
//
// --- WHY --- the default sort: when the reader picks another one, the
// component loads it again with that sort — a choice the script cannot
// know about.
//
// --- WHY --- the store owns the load and this file only asks for it: the
// fetching itself lives in lib/ts/app_page_discover.ts, so the page's request list
// is still knowable by reading one file.
import { SHIT_1170_APP_PAGE_DISCOVER_STORE } from "./app_page_discover_store";
import {
  SHIT_1170_DEFAULT_TOKEN_SORT,
  SHIT_1170_DEFAULT_TOKEN_SORT_DIRECTION,
} from "./app_page_discover_token_sort_options";
import { shit_1170_loading_bar_start_fun } from "../shared/loading_bar_start";
// ========================================
// ========================================
// --- START -----------------------------
// the loading bar's patch goes in before the page's first request.
shit_1170_loading_bar_start_fun();
void SHIT_1170_APP_PAGE_DISCOVER_STORE.load(
  SHIT_1170_DEFAULT_TOKEN_SORT,
  SHIT_1170_DEFAULT_TOKEN_SORT_DIRECTION === "desc",
);
// ========================================
// copyright 2026 by sleet.near
// ========================================
