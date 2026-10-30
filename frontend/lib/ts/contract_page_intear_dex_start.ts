// ========================================
// the intear dex page's start: it begins the page's load.
//
// the page's html loads this script, so the load starts as soon as the
// page is parsed — before the components mount, and without any
// component having to ask for it.
//
// --- WHY --- a script and not a component: a component that called the
// load would be doing two jobs — displaying and starting the page's
// work. the page's html says when the page starts, so the html starts
// it.
//
// --- WHY --- the store owns the load and this file only asks for it:
// the fetching itself lives in lib/ts/contract_page_intear_dex.ts, so
// the page's request list is still knowable by reading one file.
import { HUGGIES_CONTRACT_PAGE_INTEAR_DEX_STORE } from "./contract_page_intear_dex_store";
// ========================================
// ========================================
// --- START -----------------------------
// begin the page's load.
void HUGGIES_CONTRACT_PAGE_INTEAR_DEX_STORE.load();
// ========================================
// copyright 2026 by sleet.near
