// ========================================
// the discover page's start: it begins the page's load.
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
// --- WHY --- the default sort: the list is loaded with the page's
// default sort. when the reader picks another one, the component loads
// it again with that sort — a choice the script cannot know about.
//
// --- WHY --- the store owns the load and this file only asks for it:
// the fetching itself lives in lib/ts/app_page_discover.ts, so the
// page's request list is still knowable by reading one file.
import { HUGGIES_APP_PAGE_DISCOVER_STORE } from "./app_page_discover_store";
import {
  HUGGIES_DEFAULT_TOKEN_SORT,
  HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION,
} from "./app_page_discover_token_sort";
// ========================================
// ========================================
// --- START -----------------------------
// begin the page's load with the default sort.
void HUGGIES_APP_PAGE_DISCOVER_STORE.load(
  HUGGIES_DEFAULT_TOKEN_SORT,
  HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION === "desc",
);
// ========================================
// copyright 2026 by sleet.near
// ========================================
