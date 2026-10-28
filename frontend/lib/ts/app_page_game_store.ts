// ========================================
// the game page's shared state: the one load, held here, read by every
// component on the page.
//
// the components on this page do not fetch. they read this store. that
// is what makes the page's request list knowable — there is exactly one
// loader (lib/ts/app_page_game.ts), so there is exactly one set of
// requests.
//
// the store has the same shape as lib/ts/app_page_discover_store.ts:
// plain module state, a subscribe/unsubscribe pair, and a notify that a
// throwing subscriber cannot break.
//
// --- WHY --- the game page has no id: there is nothing in the url to
// read and no account to sign in. the list of meme tokens is a
// constant (lib/ts/app_page_game_emoji_tokens.ts), so the page's data
// is fixed and the store only ever loads once.
import { HUGGIES_APP_PAGE_GAME } from "./app_page_game";
import type { HUGGIES_APP_PAGE_GAME_DATA } from "./app_page_game";
// ========================================
// --- STATE ------------------------------
// the loaded data, or null while it is still loading.
let data: HUGGIES_APP_PAGE_GAME_DATA | null = null;
// true while a load is running.
let loading = false;
// true once the load has run, so it is not run again by a second
// caller.
let loaded = false;
// the plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing cannot break the
// flow that notified.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[app_page_game_store] listener failed", err);
    }
  }
}
// register a re-render callback; returns an unsubscribe so components
// can clean up on unmount instead of leaking.
function subscribe_fun(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}
// ========================================
// --- LOAD -------------------------------
// load the page's data.
//
// the load runs once. a second call while a load is running is ignored,
// so the page cannot fetch twice because two components asked for it.
//
// --- WHY --- the load takes no argument: the page has no id and no
// sort. the meme tokens are a constant, so there is nothing for a
// caller to choose.
async function app_page_game_store_load_fun(): Promise<void> {
  if (loading || loaded) return;
  loading = true;
  notify_fun();
  try {
    data = await HUGGIES_APP_PAGE_GAME.load();
  } catch (err) {
    data = {
      icons: {},
      errors: [err instanceof Error ? err.message : String(err)],
    };
  } finally {
    loading = false;
    loaded = true;
    notify_fun();
  }
}
// ========================================
// --- READ ------------------------------
// the loaded data, or null while it is still loading.
function get_fun(): HUGGIES_APP_PAGE_GAME_DATA | null {
  return data;
}
// true while a load is running.
function is_loading_fun(): boolean {
  return loading;
}
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_GAME_STORE = {
  load: app_page_game_store_load_fun,
  subscribe: subscribe_fun,
  get: get_fun,
  is_loading: is_loading_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
