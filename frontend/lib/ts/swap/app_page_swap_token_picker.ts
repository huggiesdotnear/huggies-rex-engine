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
//
// --- WHY THE ROWS ARE THE DISCOVER ROW SHAPE: the picker draws the
// discover page's token list (components/shared/token_list.tsx), and
// that list takes the discover row. a picker row of its own shape
// would have to be mapped into it, and the two shapes would drift.
import { search_tokens_fun } from "../discover/app_page_discover_token_search";
import { SHIT_1170_DISCOVER_TOKEN_LIST } from "../discover/app_page_discover_token_list";
import { SHIT_1170_APP_PAGE_DISCOVER } from "../discover/app_page_discover";
import { order_discover_tokens_fun } from "../discover/app_page_discover_token_sort_apply";
import { fetch_token_icons_fun } from "../shared/token_icon_fetch";
import { SHIT_1170_APP_PAGE_SWAP_STORE } from "./app_page_swap_store";
import { SHIT_1170_NEAR_ID, SHIT_1170_NEAR_SYMBOL } from "../shared/token_near";
import {
  SHIT_1170_DEFAULT_TOKEN_SORT,
  SHIT_1170_DEFAULT_TOKEN_SORT_DIRECTION,
  type SHIT_1170_TOKEN_SORT,
  type SHIT_1170_TOKEN_SORT_DIRECTION,
} from "../discover/app_page_discover_token_sort_options";
import type { SHIT_1170_DISCOVER_TOKEN_ROW } from "../discover/app_page_discover_token_row";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the picker's whole state.
export interface SHIT_1170_SWAP_PICKER_STATE {
  // is the popup open?
  open: boolean;
  // which side is picking: the token in or the token out.
  side: "in" | "out";
  // the heading on the popup.
  label: string;
  // the rows on screen.
  tokens: ReadonlyArray<SHIT_1170_DISCOVER_TOKEN_ROW>;
  // true while the rows are being fetched.
  loading: boolean;
  // the sort the rows on screen are in.
  sort: SHIT_1170_TOKEN_SORT;
  // the direction the rows on screen are in.
  direction: SHIT_1170_TOKEN_SORT_DIRECTION;
}
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how many rows the picker shows before the reader searches.
//
// --- WHY --- the picker is not a paged list: it is a short list of the
// most liquid tokens, and the search finds anything else. a reader who
// wants to scroll through seven thousand tokens is not going to.
const SHIT_1170_PICKER_LIST_LIMIT = 50;
// ========================================
// ========================================
// --- STATE ------------------------------
// the state the picker holds.
let state: SHIT_1170_SWAP_PICKER_STATE = {
  open: false,
  side: "in",
  label: "TOKEN",
  tokens: [],
  loading: false,
  sort: SHIT_1170_DEFAULT_TOKEN_SORT,
  direction: SHIT_1170_DEFAULT_TOKEN_SORT_DIRECTION,
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
function set_state_fun(next: SHIT_1170_SWAP_PICKER_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// ========================================
// --- NEAR ------------------------------
// native NEAR as a picker row.
//
// --- WHY --- THE API DOES NOT LIST IT: intear has no `near` entry in
// /tokens — it comes back in the response's `missing` list — so the
// chain's own token is not in the token list and not in the search
// results either. without this row the picker could not offer the one
// token every wallet holds.
//
// --- WHY --- IT BORROWS wNEAR's ICON: wNEAR tracks NEAR one for one,
// so its icon IS the NEAR logo (the green "N"), not a lookalike.
//
// --- WHY --- THE ICON HASH IS WRITTEN DOWN AND NOT FETCHED: the api
// has no `near` entry to ask for the hash of, and the hash for wNEAR
// is a fixed value — the icon it points at is content addressed, so it
// never changes under a different hash.
const SHIT_1170_NEAR_ICON_URL =
  "https://api.intea.rs/icon/tKxD06CdiM_S80-L.webp";
function near_row_fun(): SHIT_1170_DISCOVER_TOKEN_ROW {
  return {
    id: SHIT_1170_NEAR_ID,
    name: "Near Protocol",
    symbol: SHIT_1170_NEAR_SYMBOL,
    decimals: 24,
    icon: SHIT_1170_NEAR_ICON_URL,
    price_usd: 0,
    reputation: "Reputable",
    holders: 0,
    volume_usd_24h: 0,
    market_cap_usd: 0,
  };
}
// ========================================
// ========================================
// --- FETCH -----------------------------
// the tokens the picker shows before the reader searches: the marked
// tokens, then the most liquid ones, in the chosen sort.
//
// --- WHY --- THE SORT IS ASKED FOR FROM THE API: the api sorts and
// pages on its own, so asking it for a sort is one request that comes
// back ordered. sorting a downloaded list in javascript would mean
// downloading the whole index to sort a slice of it.
//
// --- WHY --- THE MARKED TOKENS ARE FETCHED TOO: they are the tokens we
// spotlight, and a reader picking a token wants them at the top of the
// list — the same place the discover page puts them. they are asked for
// by id, because the api cannot sort by "our marked tokens".
//
// --- WHY --- THE MARKED TOKENS ONLY LEAD THE `default` VIEW: the other
// sorts are strict — the reader asked for volume or market cap, and
// the rows arrive in that order. the marked block is a landing view,
// not a permanent override.
async function load_default_tokens_fun(): Promise<void> {
  set_state_fun({ ...state, loading: true });
  try {
    const wants_marked = state.sort === "default";
    const [page, marked] = await Promise.all([
      SHIT_1170_DISCOVER_TOKEN_LIST.fetch(
        state.sort,
        state.direction === "desc",
        0,
        SHIT_1170_PICKER_LIST_LIMIT,
      ),
      wants_marked
        ? SHIT_1170_APP_PAGE_DISCOVER.load_favourites()
        : Promise.resolve([]),
    ]);
    const icons = await fetch_token_icons_fun([
      ...page.rows.map((row) => row.id),
      ...marked.map((row) => row.id),
    ]);
    const tokens = page.rows.map((row) => ({
      ...row,
      icon: icons.get(row.id) ?? row.icon,
    }));
    // --- WHY --- NEAR IS PUT AT THE TOP AND NOT AT THE END: it is the
    // token every wallet holds, so it is the one a reader is most
    // likely to be reaching for.
    const with_near = [
      near_row_fun(),
      ...tokens.filter((t) => t.id !== SHIT_1170_NEAR_ID),
    ];
    // --- WHY --- THE MARKED TOKENS GO ON TOP: the order module is the
    // ONE place that puts them there, and it is the same module the
    // discover page uses. so the two pages lead with the same tokens.
    const with_marked = marked.map((row) => ({
      ...row,
      icon: icons.get(row.id) ?? row.icon,
    }));
    set_state_fun({
      ...state,
      tokens: order_discover_tokens_fun([...with_marked, ...with_near]),
      loading: false,
    });
  } catch (err) {
    console.warn("[app_page_swap_token_picker] the token list failed", err);
    set_state_fun({ ...state, tokens: [near_row_fun()], loading: false });
  }
}
// ========================================
// the search results, for what the reader typed.
async function search_fun(query: string): Promise<void> {
  set_state_fun({ ...state, loading: true });
  try {
    const rows = await search_tokens_fun(query);
    const icons = await fetch_token_icons_fun(rows.map((row) => row.id));
    const tokens = rows.map((row) => ({
      ...row,
      icon: icons.get(row.id) ?? row.icon,
    }));
    // --- WHY --- NEAR IS ADDED WHEN THE SEARCH FINDS IT: the api
    // cannot find it, so a reader who typed "near" would get nothing.
    // the query is matched against the symbol and the name, so it only
    // joins the list when the reader was actually asking for it.
    const matches_near =
      query.trim().toLowerCase() === SHIT_1170_NEAR_ID ||
      query.trim().toLowerCase() === SHIT_1170_NEAR_SYMBOL.toLowerCase();
    const with_near =
      matches_near && !tokens.some((t) => t.id === SHIT_1170_NEAR_ID)
        ? [near_row_fun(), ...tokens]
        : tokens;
    set_state_fun({ ...state, tokens: with_near, loading: false });
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
  void SHIT_1170_APP_PAGE_SWAP_STORE.set_token(side, token_id);
}
// ========================================
// the reader cleared the search box: go back to the default list.
function clear_search_fun(): void {
  if (state.tokens.length === 0 && !state.loading) return;
  void load_default_tokens_fun();
}
// ========================================
// the reader picked another sort key.
//
// --- WHY --- THE LIST IS LOADED AGAIN: the api sorts the rows it
// serves, so a different sort is a different request and a different
// set of rows. sorting the rows on screen in javascript would mean
// downloading the whole index to sort a slice of it.
//
// --- WHY --- THE SEARCH IS DROPPED: the search results are a handful
// of arbitrary tokens and are not the top of any sort, so the sort row
// and the search results are two different things and only one of them
// can be on screen. the search is the reader's own question about a
// token they already half-know the name of, so it wins — and the sort
// they just picked applies to the list they get back when they clear
// the box.
async function set_sort_fun(sort: SHIT_1170_TOKEN_SORT): Promise<void> {
  if (state.sort === sort) return;
  set_state_fun({ ...state, sort });
  await load_default_tokens_fun();
}
// ========================================
// the reader flipped the direction.
//
// --- WHY --- IT IS ITS OWN ACTION AND NOT A PART OF THE SORT: the
// direction is half of the view, and flipping it is a different
// request from picking a different key.
async function set_direction_fun(
  direction: SHIT_1170_TOKEN_SORT_DIRECTION,
): Promise<void> {
  if (state.direction === direction) return;
  set_state_fun({ ...state, direction });
  await load_default_tokens_fun();
}
// ========================================
// ========================================
// --- READ ------------------------------
function get_fun(): SHIT_1170_SWAP_PICKER_STATE {
  return state;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_SWAP_TOKEN_PICKER = {
  open: open_fun,
  close: close_fun,
  pick: pick_fun,
  search: search_fun,
  clear_search: clear_search_fun,
  set_sort: set_sort_fun,
  set_direction: set_direction_fun,
  subscribe: subscribe_fun,
  get: get_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
