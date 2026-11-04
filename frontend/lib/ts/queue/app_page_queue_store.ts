// ========================================
// the queue page's shared state: the loaded batch, the tokens it names
// and the error.
//
// the page is split into several components — the status, the summary,
// the transactions, the transfers, the accounts and the actions — and
// they all read this one store, so they cannot drift apart. the store
// owns the load, the components display.
import { SHIT_1170_APP_PAGE_QUEUE_LOAD } from "./app_page_queue_load";
import { SHIT_1170_APP_PAGE_QUEUE_URL } from "./app_page_queue_url";
import { SHIT_1170_AUTH } from "../shared/auth_status";
import type { SHIT_1170_APP_PAGE_QUEUE_STATE } from "./app_page_queue_types";
import type { SHIT_1170_TRANSFER_TOKEN } from "../shared/transfer_tokens";
import type { SHIT_1170_TX_QUEUE } from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the state the store holds, plus the tokens the batch names.
export interface SHIT_1170_APP_PAGE_QUEUE_STORE_STATE extends SHIT_1170_APP_PAGE_QUEUE_STATE {
  // the token metadata for the transfers the batch makes.
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
}
// ========================================
// ========================================
// --- STATE ------------------------------
// the state the page holds.
let state: SHIT_1170_APP_PAGE_QUEUE_STORE_STATE = {
  queue: null,
  tokens: new Map(),
  loading: false,
  error: null,
};
// the queue id the current load was for, so a load for an older id does
// not overwrite a newer one.
let loaded_for: string | null = null;
// the plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// ========================================
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing cannot break the
// notify.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[app_page_queue_store] listener failed", err);
    }
  }
}
// ========================================
// register a re-render callback; returns an unsubscribe to clean up on
// unmount.
function subscribe_fun(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}
// ========================================
// write the state and tell everyone.
function set_state_fun(next: SHIT_1170_APP_PAGE_QUEUE_STORE_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// load the batch the url names.
//
// --- WHY A MISSING ID IS AN ERROR AND NOT AN EMPTY PAGE: a url with no
// `?queue=` is a broken link, and saying so is more useful than showing
// an empty page.
async function load_fun(): Promise<void> {
  const queue_id = SHIT_1170_APP_PAGE_QUEUE_URL.read();
  if (queue_id === null) {
    set_state_fun({
      queue: null,
      tokens: new Map(),
      loading: false,
      error: "NO QUEUE IN THE URL",
    });
    return;
  }
  if (state.loading && loaded_for === queue_id) return;
  loaded_for = queue_id;
  set_state_fun({
    queue: null,
    tokens: new Map(),
    loading: true,
    error: null,
  });
  try {
    const loaded = await SHIT_1170_APP_PAGE_QUEUE_LOAD.load(queue_id);
    // a load for an older id must not overwrite a newer one.
    if (loaded_for !== queue_id) return;
    set_state_fun({
      queue: loaded.queue,
      tokens: loaded.tokens,
      loading: false,
      error: null,
    });
  } catch (err) {
    if (loaded_for !== queue_id) return;
    set_state_fun({
      queue: null,
      tokens: new Map(),
      loading: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
// ========================================
// ========================================
// --- REFRESH ---------------------------
// read the batch again.
//
// --- WHY IT EXISTS: the reader sent the batch, or added themselves to
// it, and the page should say so without a reload.
async function refresh_fun(): Promise<void> {
  await load_fun();
}
// ========================================
// ========================================
// --- READ ------------------------------
function get_fun(): SHIT_1170_APP_PAGE_QUEUE_STORE_STATE {
  return state;
}
// ========================================
// the token metadata for one token id, or null when it is unknown.
function token_of_fun(token_id: string): SHIT_1170_TRANSFER_TOKEN | null {
  return state.tokens.get(token_id) ?? null;
}
// ========================================
// the batch on screen, or null.
function queue_of_fun(): SHIT_1170_TX_QUEUE | null {
  return state.queue;
}
// ========================================
// --- WATCH -----------------------------
// follow the auth state, so a sign-in or a sign-out moves the reader's
// status on the batch.
//
// --- WHY THE QUEUE PAGE WATCHES THE AUTH: the status line is about the
// READER's account, and the reader changes when somebody signs in or
// out.
function watch_fun(): () => void {
  return SHIT_1170_AUTH.subscribe(() => {
    notify_fun();
  });
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_QUEUE_STORE = {
  load: load_fun,
  refresh: refresh_fun,
  subscribe: subscribe_fun,
  get: get_fun,
  get_queue: queue_of_fun,
  get_token: token_of_fun,
  watch: watch_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
