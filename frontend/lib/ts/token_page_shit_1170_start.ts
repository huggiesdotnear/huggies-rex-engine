// ========================================
// the $SHIT page's start: it begins the page's load.
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
// --- WHY --- the store owns the load and this file only asks for it:
// the fetching itself lives in lib/ts/token_page_shit_1170.ts, so the
// page's request list is still knowable by reading one file.
//
// --- WHY --- the page is for ONE token: the token id is a constant
// (lib/ts/token_page_shit_1170_token.ts), so the start file needs no id from the url.
import { HUGGIES_TOKEN_PAGE_SHIT_1170_STATE } from "./token_page_shit_1170_state";
// ========================================
// ========================================
// --- START -----------------------------
// begin the page's load.
void HUGGIES_TOKEN_PAGE_SHIT_1170_STATE.load();
// ========================================
// copyright 2026 by sleet.near
// ========================================
