// ========================================
// the swap page's positions state: the positions the signed-in account
// holds, and the token info needed to show them.
//
// the positions are part of the swap page, so they load with it. the
// cards read this store and never fetch.
//
// --- WHY THE POSITIONS ARE A STORE AND NOT A PART OF THE SWAP STORE:
// the swap store holds the trade the reader is MAKING — the pair, the
// amount, the routes. the positions are what the reader could trade.
// they are a different thing with a different lifetime: the trade is
// gone the moment the pair changes, while the positions are the same
// whatever the reader is swapping. putting them in the swap store
// would clear the reader's positions every time they picked a token.
import { HUGGIES_APP_PAGE_SWAP_POSITIONS } from "./app_page_swap_positions";
import { HUGGIES_TOKEN_INFO } from "../shared/token_info";
import { HUGGIES_AUTH } from "../shared/auth_status";
import type { HUGGIES_SWAP_POSITION } from "./app_page_swap_positions";
import type { HUGGIES_TOKEN_INFO as TOKEN_INFO } from "../shared/token_info";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the whole state of the positions.
export interface HUGGIES_APP_PAGE_SWAP_POSITIONS_STATE {
  // the positions, biggest first.
  positions: ReadonlyArray<HUGGIES_SWAP_POSITION>;
  // the token info for the tokens the positions are in, by token id.
  infos: ReadonlyMap<string, TOKEN_INFO>;
  // true while the positions are loading.
  loading: boolean;
  // the message for the reader, when the load failed.
  error: string | null;
}
// ========================================
// ========================================
// --- STATE ------------------------------
let state: HUGGIES_APP_PAGE_SWAP_POSITIONS_STATE = {
  positions: [],
  infos: new Map(),
  loading: false,
  error: null,
};
// the account id the positions on screen belong to.
let loaded_account_id: string | null = null;
// the plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// true once the auth state is being watched.
let watching = false;
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
      console.error(
        "[app_page_swap_positions_store] listener failed",
        err,
      );
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
function set_state_fun(next: HUGGIES_APP_PAGE_SWAP_POSITIONS_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// ========================================
// --- ORDER ------------------------------
// the positions, biggest first.
//
// --- WHY --- THE API DOES NOT SORT THEM: it answers one row per token
// the account has ever traded, in no order the reader can predict. the
// card the reader taps is most likely the one worth the most, so they
// lead.
function sort_positions_fun(
  positions: ReadonlyArray<HUGGIES_SWAP_POSITION>,
): ReadonlyArray<HUGGIES_SWAP_POSITION> {
  return [...positions].sort((a, b) => b.cost_usd - a.cost_usd);
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// load the positions of the signed-in account.
//
// --- WHY THE ACCOUNT ID IS CHECKED AGAINST THE LOADED ONE: the
// reader can sign in, sign out or switch accounts under the page, and a
// load for the old account must not land on the new one.
async function load_fun(): Promise<void> {
  const account_id = HUGGIES_AUTH.get_account_id();
  // --- WHY --- NO ACCOUNT MEANS NO POSITIONS: the reader is not signed
  // in, so there is nothing to show and nothing to sell.
  if (account_id === null) {
    loaded_account_id = null;
    set_state_fun({
      positions: [],
      infos: new Map(),
      loading: false,
      error: null,
    });
    return;
  }
  // the load is already running for this account: no second fetch.
  if (state.loading && loaded_account_id === account_id) return;
  loaded_account_id = account_id;
  set_state_fun({ ...state, loading: true, error: null });
  try {
    const positions = await HUGGIES_APP_PAGE_SWAP_POSITIONS.load(account_id);
    // a load for an account the reader has moved on from must not land.
    if (loaded_account_id !== account_id) return;
    // --- WHY --- THE TOKEN INFO COMES WITH THE POSITIONS: the card
    // shows the symbol, the icon and the amount, and the amount only
    // means something once divided by the token's decimals.
    const infos = await HUGGIES_TOKEN_INFO.get(
      positions.map((position) => position.token),
    );
    if (loaded_account_id !== account_id) return;
    set_state_fun({
      positions: sort_positions_fun(positions),
      infos,
      loading: false,
      error: null,
    });
  } catch (err) {
    if (loaded_account_id !== account_id) return;
    set_state_fun({
      ...state,
      positions: [],
      infos: new Map(),
      loading: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
// ========================================
// ========================================
// --- WATCH ------------------------------
// reload the positions when the reader signs in, signs out or switches
// account.
//
// --- WHY --- THE SUBSCRIPTION IS SET UP ONCE: a second watch would add
// a second listener, and the positions would load twice per change.
function watch_fun(): void {
  if (watching) return;
  watching = true;
  const unsubscribe = HUGGIES_AUTH.subscribe(() => {
    void load_fun();
  });
  // the subscription lives as long as the page does, so it is never
  // unsubscribed. the module is loaded once per document.
  void unsubscribe;
}
// ========================================
// ========================================
// --- READ ------------------------------
function get_fun(): HUGGIES_APP_PAGE_SWAP_POSITIONS_STATE {
  return state;
}
// ========================================
// the token info for one position's token, or null when it is unknown.
//
// --- WHY --- A MISSING TOKEN IS NOT AN ERROR: the api knows tokens the
// token registry does not, and a card with no icon and no symbol is
// still a card the reader can sell.
function info_of_fun(token_id: string): TOKEN_INFO | null {
  return state.infos.get(token_id) ?? null;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_SWAP_POSITIONS_STORE = {
  load: load_fun,
  watch: watch_fun,
  subscribe: subscribe_fun,
  get: get_fun,
  get_info: info_of_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
