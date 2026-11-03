// ========================================
// the transfer tokens store: the token metadata for the transfers on
// screen.
//
// the transaction page and the account page's transaction cards both
// show transfers, and both need the same thing — the symbol, the icon
// and the decimals of every token the transfers mention. so it lives
// in one store that both read.
//
// --- WHY IT IS A STORE AND NOT A FETCH IN THE COMPONENT: a component
// that fetches is doing two jobs, and the rule of the app is that the
// ts files fetch and the components display. the component asks the
// store for the tokens, and the store fetches them when the
// transaction changes.
//
// --- WHY IT WATCHES THE TRANSACTION AND NOT THE URL: the transaction
// is what decides which tokens are needed. a new transaction means a
// new set of tokens, and the store reloads when the transaction
// changes.
//
// --- WHY THE TOKENS ARE NOT PART OF THE TRANSACTION'S OWN STORE: the
// transaction's store holds the transaction. the tokens are metadata
// ABOUT the transaction's transfers, they are fetched from a
// DIFFERENT api (the token indexer, not the transaction api), and they
// are cached in the app's durable token cache on their own. mixing
// them would make the transaction's store responsible for a second
// api's failure.
import {
  fetch_transfer_tokens_by_ids_fun,
  transfer_contract_ids_fun,
} from "./transfer_tokens";
import type { HUGGIES_TRANSFER_TOKEN } from "./transfer_tokens";
import type { PARSE_RESULT } from "@sleet-js/fastnear-explorer-api-client";
// ========================================
// ========================================
// --- TYPES ------------------------------
// what the store holds.
export interface HUGGIES_TRANSFER_TOKENS_STATE {
  // the tokens on screen, by contract id.
  tokens: Map<string, HUGGIES_TRANSFER_TOKEN>;
  // true while the tokens are loading.
  loading: boolean;
}

// the shape of a page store the tokens store can follow: it says what
// its transaction is, and it announces when that changes.
export interface HUGGIES_WATCHED_STORE {
  // the parsed transaction on screen, or null when there is none.
  get_parsed: () => PARSE_RESULT | null;
  // register a callback that fires when the state changes.
  subscribe: (listener: () => void) => () => void;
}

// the shape of a page store that holds SEVERAL transactions: the
// account page's transaction cards.
export interface HUGGIES_WATCHED_LIST_STORE {
  // the parsed transactions on screen.
  get_parsed_list: () => ReadonlyArray<PARSE_RESULT>;
  // register a callback that fires when the state changes.
  subscribe: (listener: () => void) => () => void;
}
// ========================================
// ========================================
// --- STATE ------------------------------
// the empty state the store holds before the first load answers.
const HUGGIES_EMPTY_STATE: HUGGIES_TRANSFER_TOKENS_STATE = {
  tokens: new Map(),
  loading: false,
};
let state: HUGGIES_TRANSFER_TOKENS_STATE = HUGGIES_EMPTY_STATE;
// the transaction the current tokens belong to, so a load for the same
// transaction does not start over.
let loaded_for: PARSE_RESULT | null = null;
// the SET of transactions the current tokens belong to. the account
// page's cards show five transactions at once, so the load is guarded
// by the set and not by one transaction.
let loaded_for_list: ReadonlyArray<PARSE_RESULT> | null = null;
// the key the last load was for, so the same set does not load twice.
let loaded_key: ReadonlyArray<PARSE_RESULT> | null = null;
// the plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// ========================================
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing cannot break the notify.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[transfer_tokens_store] listener failed", err);
    }
  }
}
// register a re-render callback; returns an unsubscribe to clean up on unmount.
function subscribe_fun(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}
// ========================================
// ========================================
// --- WRITE ------------------------------
function set_state_fun(next: HUGGIES_TRANSFER_TOKENS_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// ========================================
// --- LOAD ------------------------------
// load the tokens a transaction's transfers mention.
//
// --- WHY THE LOAD IS NOT GUARDED BY A HASH: the store is fed the
// parsed transaction, and the same transaction parsed twice is the
// same object here — the page's store hands out the same parsed
// result. so the identity check is enough to know the answer is
// current.
//
// --- WHY A FAILING LOAD LEAVES THE TOKENS EMPTY AND NOT STALE: the
// tokens belong to a transaction, and a transaction's tokens are the
// ones of THAT transaction. keeping the old ones would put the wrong
// symbol next to an amount.
async function load_fun(parsed: PARSE_RESULT | null): Promise<void> {
  if (parsed === null) {
    loaded_for = null;
    loaded_key = null;
    set_state_fun(HUGGIES_EMPTY_STATE);
    return;
  }
  await load_many_fun([parsed]);
}
// ========================================
// ========================================
// --- LOAD MANY -------------------------
// load the tokens for a SET of transactions.
//
// --- WHY A SET: the account page's cards show five transactions at
// once, and each one names its own tokens. asking for them together is
// one request for the whole page and not one per card.
//
// --- WHY THE KEY IS THE SET AND NOT THE LIST: the same five
// transactions come back from the details store as the same five
// objects, so the identity of the list is what tells us the answer is
// current. a new set of transactions is a new key and a new load.
async function load_many_fun(
  parsed_list: ReadonlyArray<PARSE_RESULT>,
): Promise<void> {
  const key = parsed_list;
  if (loaded_key === key && loaded_for_list === parsed_list) return;
  loaded_key = key;
  loaded_for_list = parsed_list;
  set_state_fun({ tokens: new Map(), loading: true });
  const tokens = new Map<string, HUGGIES_TRANSFER_TOKEN>();
  // --- WHY THE TRANSACTIONS ARE ASKED FOR ONE BY ONE: the token
  // reader takes a list of token ids, not a list of transactions. so
  // the ids are gathered from every transaction and asked for
  // together — one request for the whole page.
  const ids: string[] = [];
  for (const parsed of parsed_list) {
    for (const id of transfer_contract_ids_fun(parsed)) ids.push(id);
  }
  if (ids.length > 0) {
    const fetched = await fetch_transfer_tokens_by_ids_fun(ids);
    for (const [id, token] of fetched) tokens.set(id, token);
  }
  // a newer load has taken over, so this answer is dropped.
  if (loaded_for_list !== parsed_list) return;
  set_state_fun({ tokens, loading: false });
}
// ========================================
// ========================================
// --- READ ------------------------------
function get_state_fun(): HUGGIES_TRANSFER_TOKENS_STATE {
  return state;
}
// ========================================
// ========================================
// --- WATCH -----------------------------
// follow a page's store and reload the tokens whenever the page's
// transaction changes.
//
// --- WHY THE PAGE STORE IS WATCHED AND NOT THE TRANSACTION PASSED IN:
// the page's store is the one that knows WHEN there is a transaction.
// a component that asked for the tokens would have to re-ask on every
// render, and a page store that reloads would be asked twice.
//
// --- WHY THE SUBSCRIPTION IS KEPT: without it the tokens would be
// fetched once and never again, and a reader who opens a second
// transaction in the same tab would see the first one's symbols.
function watch_fun(page_store: HUGGIES_WATCHED_STORE): () => void {
  const reload = (): void => {
    const parsed = page_store.get_parsed();
    void load_fun(parsed);
  };
  const unsubscribe = page_store.subscribe(reload);
  // the transaction may already be there.
  reload();
  return unsubscribe;
}
// ========================================
// ========================================
// --- WATCH MANY ------------------------
// follow a page's store and reload the tokens for every transaction it
// holds.
//
// --- WHY THE ACCOUNT PAGE NEEDS THIS: its cards show five
// transactions at once, and each one names its own tokens. the one
// transaction watch would only ever look at the first, so the rest
// would show raw amounts.
function watch_many_fun(page_store: HUGGIES_WATCHED_LIST_STORE): () => void {
  const reload = (): void => {
    const parsed = page_store.get_parsed_list();
    void load_many_fun(parsed);
  };
  const unsubscribe = page_store.subscribe(reload);
  // the transactions may already be there.
  reload();
  return unsubscribe;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_TRANSFER_TOKENS_STORE = {
  get: get_state_fun,
  subscribe: subscribe_fun,
  load: load_fun,
  load_many: load_many_fun,
  watch: watch_fun,
  watch_many: watch_many_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
