// ========================================
// the token picker's state: which side is picking, the rows on screen,
// and the search.
//
// the picker is part of the swap page, so its fetching lives with the
// page's other fetching. it reuses the discover page's search — the
// api has a real search index behind /tokens/search — so a token
// outside the loaded list is still findable.
//
// --- WHY IT REUSES THE DISCOVER SEARCH AND NOT A COPY: the search
// helper is exactly what the picker needs, and a second copy of the
// api call is a second place for the field list to drift.
import { search_tokens_fun } from "../discover/app_page_discover_token_search";
import { HUGGIES_DISCOVER_TOKEN_LIST } from "../discover/app_page_discover_token_list";
import { fetch_token_icons_fun } from "../shared/token_icon_fetch";
import { HUGGIES_APP_PAGE_SWAP_STORE } from "./app_page_swap_store";
// ========================================
// ========================================
// --- TYPES ------------------------------
// one row in the picker's list.
export interface HUGGIES_SWAP_PICKER_TOKEN {
  id: string;
  name: string;
  symbol: string;
  icon: string | null;
}
// ========================================
// the picker's whole state.
export interface HUGGIES_SWAP_PICKER_STATE {
  // is the popup open?
  open: boolean;
  // which side is picking: the token in or the token out.
  side: "in" | "out";
  // the heading on the popup.
  label: string;
  // the rows on screen.
  tokens: ReadonlyArray<HUGGIES_SWAP_PICKER_TOKEN>;
  // true while the rows are being fetched.
  loading: boolean;
}
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how many rows the picker shows before the reader searches.
//
// --- WHY --- the picker is not a paged list: it is a short list of the
// most liquid tokens, and the search finds anything else. a reader who
// wants to scroll through seven thousand tokens is not going to.
const HUGGIES_PICKER_LIST_LIMIT = 50;
// ========================================
// ========================================
// --- STATE ------------------------------
let state: HUGGIES_SWAP_PICKER_STATE = {
  open: false,
  side: "in",
  label: "TOKEN",
  tokens: [],
  loading: false,
};
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
      console.error("[app_page_swap_token_picker] listener failed", err);
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
function set_state_fun(next: HUGGIES_SWAP_PICKER_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// map the discover row shape into the picker's row shape.
function map_row_fun(row: {
  id: string;
  name: string;
  symbol: string;
  icon: string | null;
}): HUGGIES_SWAP_PICKER_TOKEN {
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    icon: row.icon,
  };
}
// ========================================
// ========================================
// --- FETCH -----------------------------
// the tokens the picker shows before the reader searches: the most
// liquid ones, by volume.
async function load_default_tokens_fun(): Promise<void> {
  set_state_fun({ ...state, loading: true });
  try {
    const page = await HUGGIES_DISCOVER_TOKEN_LIST.fetch(
      "volume_usd_24h",
      true,
      0,
      HUGGIES_PICKER_LIST_LIMIT,
    );
    const icons = await fetch_token_icons_fun(page.rows.map((row) => row.id));
    const tokens = page.rows.map((row) =>
      map_row_fun({ ...row, icon: icons.get(row.id) ?? row.icon }),
    );
    set_state_fun({ ...state, tokens, loading: false });
  } catch (err) {
    console.warn("[app_page_swap_token_picker] the token list failed", err);
    set_state_fun({ ...state, tokens: [], loading: false });
  }
}
// ========================================
// the search results, for what the reader typed.
async function search_fun(query: string): Promise<void> {
  set_state_fun({ ...state, loading: true });
  try {
    const rows = await search_tokens_fun(query);
    const icons = await fetch_token_icons_fun(rows.map((row) => row.id));
    const tokens = rows.map((row) =>
      map_row_fun({ ...row, icon: icons.get(row.id) ?? row.icon }),
    );
    set_state_fun({ ...state, tokens, loading: false });
  } catch (err) {
    console.warn("[app_page_swap_token_picker] the search failed", err);
    set_state_fun({ ...state, tokens: [], loading: false });
  }
}
// ========================================
// ========================================
// --- OPEN ------------------------------
// open the picker for one side of the swap.
//
// --- WHY --- the list is loaded when the picker OPENS and not when the
// page loads: a reader who never opens the picker never pays for the
// list, and the list is the one request the picker makes on its own.
async function open_fun(side: "in" | "out"): Promise<void> {
  set_state_fun({
    ...state,
    open: true,
    side,
    label: side === "in" ? "TOKEN IN" : "TOKEN OUT",
  });
  await load_default_tokens_fun();
}
// ========================================
// close the picker.
function close_fun(): void {
  if (!state.open) return;
  set_state_fun({ ...state, open: false });
}
// ========================================
// the reader chose a token: hand it to the swap store and close.
function pick_fun(token_id: string): void {
  const side = state.side;
  set_state_fun({ ...state, open: false });
  void HUGGIES_APP_PAGE_SWAP_STORE.set_token(side, token_id);
}
// ========================================
// the reader cleared the search box: go back to the default list.
function clear_search_fun(): void {
  if (state.tokens.length === 0 && !state.loading) return;
  void load_default_tokens_fun();
}
// ========================================
// ========================================
// --- READ ------------------------------
function get_fun(): HUGGIES_SWAP_PICKER_STATE {
  return state;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_SWAP_TOKEN_PICKER = {
  open: open_fun,
  close: close_fun,
  pick: pick_fun,
  search: search_fun,
  clear_search: clear_search_fun,
  subscribe: subscribe_fun,
  get: get_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
