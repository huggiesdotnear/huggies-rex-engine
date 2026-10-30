// ========================================
// the pumpopoly page's start: it begins the page's load.
//
// the page's html loads this script, so the load starts as soon as the
// page is parsed — before the components mount, and without any
// component having to ask for it.
//
// --- WHY --- a script and not a component: the player stats and the nft
// list used to each call the store's load() from their own effect. two
// components asking for the same page's data is two chances to start the
// same load, and it hides WHICH component the page depends on to have any
// data at all. the page's html says when the page starts, so the html
// starts it.
//
// --- WHY --- the store owns the load and this file only asks for it:
// the fetching itself lives in lib/ts/contract_page_pumpopoly.ts, so
// the page's request list is still knowable by reading one file.
//
// --- WHY --- the player id comes from the shared page_account_id.ts: the
// url names the player and that is final — a sign-in must not steal the
// page. with no id on the url, the signed-in account is the fallback, and a
// later sign-in fills it in. the store watches that module and re-loads by
// itself.
import { HUGGIES_PAGE_ACCOUNT_ID } from "./page_account_id";
import { HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE } from "./contract_page_pumpopoly_store";
// ========================================
// ========================================
// --- START -----------------------------
// begin the page's load for the player the page is about, and watch the
// id so a later change reloads the page by itself.
HUGGIES_PAGE_ACCOUNT_ID.init();
HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE.watch();
void HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE.load();
// ========================================
// copyright 2026 by sleet.near
// ========================================
