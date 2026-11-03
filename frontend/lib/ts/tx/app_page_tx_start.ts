// ========================================
// the transaction page's start: it begins the page's load.
//
// the page's import file pulls this in, so the load starts before the
// components mount.
//
// --- WHY --- a script and not a component: a component that called the
// load would be doing two jobs — displaying and starting the page's
// work.
//
// --- WHY --- the store owns the load and this file only asks for it:
// the fetching itself lives in lib/ts/app_page_tx.ts, so the page's
// request list is still knowable by reading one file.
import { HUGGIES_APP_PAGE_TX_STORE } from "./app_page_tx_store";
import { HUGGIES_TRANSFER_TOKENS_STORE } from "../shared/transfer_tokens_store";
import { huggies_loading_bar_start_fun } from "../shared/loading_bar_start";
// ========================================
// ========================================
// --- START -----------------------------
// the loading bar's patch goes in before the page's first request.
huggies_loading_bar_start_fun();
// begin the page's load for the transaction the url names.
void HUGGIES_APP_PAGE_TX_STORE.load();
// --- WHY THE TOKENS ARE WATCHED HERE: the transfers need the symbol,
// the icon and the decimals of every token the transaction moved, and
// the tokens come from the token indexer — a different api from the
// one the transaction came from. the watch follows the transaction, so
// a new transaction asks for its own tokens.
HUGGIES_TRANSFER_TOKENS_STORE.watch(HUGGIES_APP_PAGE_TX_STORE);
// ========================================
// copyright 2026 by sleet.near
// ========================================
