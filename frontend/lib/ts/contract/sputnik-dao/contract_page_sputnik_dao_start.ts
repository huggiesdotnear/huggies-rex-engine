// ========================================
// the sputnik dao page's start: it begins the page's load.
//
// the page's import file pulls this in, so the load starts before the
// components mount, and without any component having to ask for it.
//
// --- WHY --- a script and not a component: a component that called the
// load would be doing two jobs — displaying and starting the page's
// work. the page's import file says when the page starts, so the page
// starts it.
//
// --- WHY --- the store owns the load and this file only asks for it:
// the fetching itself lives in lib/ts/contract_page_sputnik_dao.ts, so
// the page's request list is still knowable by reading one file.
import { HUGGIES_DAO_PAGE_STATE } from "./contract_page_sputnik_dao_state";
import { huggies_loading_bar_start_fun } from "../../shared/loading_bar_start";
// ========================================
// ========================================
// --- START -----------------------------
// the loading bar's patch goes in before the page's first request.
huggies_loading_bar_start_fun();
// begin the page's load.
void HUGGIES_DAO_PAGE_STATE.load();
// ========================================
// copyright 2026 by sleet.near
// ========================================
