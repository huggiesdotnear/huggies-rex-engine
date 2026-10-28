// ========================================
// the token page's start: it begins the page's load.
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
// the fetching itself lives in lib/ts/token_page_token.ts, so the
// page's request list is still knowable by reading one file.
//
// --- WHY --- the token id comes from the url: the page shows the
// token named by `?id=`, and the components read the same id from the
// same place, so there is one source for it.
import { HUGGIES_TOKEN_PAGE_TOKEN_STATE } from "./token_page_token_state";
// ========================================
// ========================================
// --- START -----------------------------
// begin the page's load for the token the url names.
void HUGGIES_TOKEN_PAGE_TOKEN_STATE.load();
// ========================================
// copyright 2026 by sleet.near
// ========================================
