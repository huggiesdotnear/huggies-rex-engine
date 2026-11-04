// ========================================
// the unit conversion page's shared state: the token, the two amounts and the
// error.
//
// the page is split into a form component and the token picker it
// shares with the swap page, and they all read this one store, so they
// cannot drift apart. the store owns the load, the components display.
//
// --- WHY THE STATE IS ONE OBJECT AND NOT SEVERAL STORES: the pieces
// are ONE view. the two amount boxes are two views of ONE amount, and
// the token the amounts belong to is the same token for both — a split
// would let one show a number for a token the other has moved on from.
import { SHIT_1170_APP_PAGE_UNIT_CONVERSION_URL } from "./app_page_unit_conversion_url";
import { SHIT_1170_TOKEN_INFO } from "../shared/token_info";
import { SHIT_1170_SHIT_TOKEN_ID } from "../shared/shit_1170_token";
import {
  human_to_unit_fun,
  unit_to_human_fun,
} from "../swap/app_page_swap_amount";
import type { SHIT_1170_TOKEN_INFO as TOKEN_INFO } from "../shared/token_info";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the whole state of the unit conversion page.
export interface SHIT_1170_APP_PAGE_UNIT_CONVERSION_STATE {
  // the token being converted, the contract address from the url.
  token: string;
  // the info for the token, once it is known.
  token_info: TOKEN_INFO | null;
  // the human amount the reader typed or that was derived.
  human: string;
  // the unit amount the reader typed or that was derived.
  unit: string;
  // which side the reader fixed: the box they typed into.
  //
  // --- WHY --- the two boxes are two views of ONE amount. the reader
  // types into one of them, and the other shows the conversion, so the
  // store has to know which one is the reader's number and which one
  // is the derivation.
  fixed_side: "human" | "unit";
  // true while the token's info is on its way.
  loading: boolean;
  // the message for the reader, when something failed.
  error: string | null;
}
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the token the page opens on.
//
// --- WHY --- $SHIT is this app's own token, so it is the one a reader
// is most likely converting. the reader picks their own with the token
// picker, or lands on one from a link.
const SHIT_1170_UNIT_CONVERSION_DEFAULT_TOKEN = SHIT_1170_SHIT_TOKEN_ID;
// ========================================
// ========================================
// --- STATE ------------------------------
// the state the page holds.
let state: SHIT_1170_APP_PAGE_UNIT_CONVERSION_STATE = {
  token: SHIT_1170_UNIT_CONVERSION_DEFAULT_TOKEN,
  token_info: null,
  human: "",
  unit: "",
  fixed_side: "human",
  loading: false,
  error: null,
};
// the plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// the amounts the url carried on the first load, waiting for the
// token's decimals.
//
// --- WHY --- IT IS HELD AND NOT CONVERTED RIGHT AWAY: converting
// either way needs the token's decimals — the human side needs them to
// become units, the unit side needs them to become human — and those
// arrive with the token info, which the page fetches. so the url's
// amounts wait here until the info lands, and are turned into the box
// pair then.
let pending_url_human: string | null = null;
let pending_url_unit: string | null = null;
let pending_url_side: "human" | "unit" = "human";
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
      console.error("[app_page_unit_conversion_store] listener failed", err);
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
function set_state_fun(next: SHIT_1170_APP_PAGE_UNIT_CONVERSION_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// ========================================
// --- AMOUNTS ---------------------------
// derive the OTHER box from the one the reader fixed, and write both to
// the url.
//
// --- WHY IT LIVES HERE AND NOT IN THE COMPONENT: the two boxes are two
// views of one amount, and the conversion in each direction has to be
// exact. one place that owns both directions cannot disagree with
// itself, and no caller can convert one way and forget the other.
//
// --- WHY --- A HALF-TYPED HUMAN AMOUNT PUTS NO UNIT ON THE URL: the
// reader is still typing ("1." is fine and converts, "." is not), and a
// link that cannot say the unit amount says nothing rather than
// something wrong. the HUMAN amount stays on the url either way, so the
// reader's number is not lost to a reload mid-keystroke.
//
// --- WHY --- A NON-NUMERIC UNIT AMOUNT PUTS NO HUMAN ON THE URL: the
// unit box only means one thing — the token's smallest unit, a plain
// integer — so anything else cannot be turned into a human amount, and
// the url carries only what it can say.
function derive_fun(
  fixed_side: "human" | "unit",
  fixed_amount: string,
  decimals: number | null,
): { human: string; unit: string } {
  if (fixed_side === "human") {
    if (decimals === null) return { human: fixed_amount, unit: "" };
    const unit = human_to_unit_fun(fixed_amount, decimals);
    return { human: fixed_amount, unit: unit ?? "" };
  }
  if (decimals === null || !/^\d+$/.test(fixed_amount.trim())) {
    return { human: "", unit: fixed_amount };
  }
  return {
    human: unit_to_human_fun(fixed_amount, decimals),
    unit: fixed_amount,
  };
}
// ========================================
// write the pair to the url.
//
// --- WHY --- THE URL IS WRITTEN WITH BOTH BOXES: the link says what the
// screen says, and the screen shows two boxes. a half-typed fixed side
// still writes itself, and its partner goes when it cannot be derived.
function write_url_fun(human: string, unit: string): void {
  SHIT_1170_APP_PAGE_UNIT_CONVERSION_URL.write(
    state.token,
    human.trim().length === 0 ? null : human,
    unit.trim().length === 0 ? null : unit,
  );
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// the token's info, for the decimals the conversions need.
//
// --- WHY --- the info comes FIRST and the amounts are applied after
// it: both conversions scale by the token's decimals, and the decimals
// arrive with the info.
async function load_token_fun(token: string): Promise<void> {
  set_state_fun({ ...state, loading: true, error: null });
  try {
    const info_map = await SHIT_1170_TOKEN_INFO.get([token]);
    const token_info = info_map.get(token) ?? null;
    set_state_fun({ ...state, token_info, loading: false });
    apply_pending_url_amounts_fun(token_info);
  } catch (err) {
    set_state_fun({
      ...state,
      loading: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
// ========================================
// put the url's amounts into the two boxes.
//
// --- WHY --- THE SIDE THE URL FIXED IS THE FIXED SIDE: the parameter the
// reader's number sat in IS the box it belongs to, and the other box is
// the derivation. when both are set — they normally are, because both
// are written — the unit amount is the exact one, so the unit side is
// the fixed one. that is the same rule the reader says out loud when
// they read a link: "this is the number of units".
//
// --- WHY --- THE AMOUNTS GO WHEN THE TOKEN'S DECIMALS ARE UNKNOWN:
// without them neither direction converts, so there is nothing honest to
// show. the fixed side's raw text is kept in its box so the reader can
// see what the link carried, and the other box stays empty.
function apply_pending_url_amounts_fun(token_info: TOKEN_INFO | null): void {
  const human = pending_url_human;
  const unit = pending_url_unit;
  if (human === null && unit === null) return;
  const side = pending_url_side;
  pending_url_human = null;
  pending_url_unit = null;
  const decimals = token_info?.decimals ?? null;
  if (side === "unit") {
    const derived = derive_fun("unit", unit ?? "", decimals);
    set_state_fun({
      ...state,
      human: derived.human,
      unit: derived.unit,
      fixed_side: "unit",
    });
    write_url_fun(derived.human, derived.unit);
    return;
  }
  const derived = derive_fun("human", human ?? "", decimals);
  set_state_fun({
    ...state,
    human: derived.human,
    unit: derived.unit,
    fixed_side: "human",
  });
  write_url_fun(derived.human, derived.unit);
}
// ========================================
// load the page: the token from the url, its info, and the amounts the
// link carried.
//
// --- WHY --- THE TOKEN IS WRITTEN BACK TO THE URL: a link that opens
// the page with no parameters gets the default token, and writing it
// back means the link the reader copies then says the same thing the
// screen does.
async function load_fun(): Promise<void> {
  const from_url = SHIT_1170_APP_PAGE_UNIT_CONVERSION_URL.read_ca();
  const amounts = SHIT_1170_APP_PAGE_UNIT_CONVERSION_URL.read_amounts();
  const token = from_url ?? SHIT_1170_UNIT_CONVERSION_DEFAULT_TOKEN;
  pending_url_human = amounts.human;
  pending_url_unit = amounts.unit;
  pending_url_side = amounts.side;
  set_state_fun({
    ...state,
    token,
    token_info: null,
    human: "",
    unit: "",
    fixed_side: amounts.side,
  });
  SHIT_1170_APP_PAGE_UNIT_CONVERSION_URL.write(token, null, null);
  await load_token_fun(token);
}
// ========================================
// ========================================
// --- SET -------------------------------
// the reader picked a token.
//
// --- WHY --- THE FIXED SIDE'S AMOUNT CARRIES OVER: the reader fixed
// one side of the conversion — "1.5 of this" or "1500000 units of this"
// — and the amount is the same KIND of thing for the new token, so it
// is kept and the other box is re-derived with the new token's
// decimals. what cannot carry over is a derivation made with the old
// token's decimals, so the derived box is always rebuilt.
async function set_token_fun(token_id: string): Promise<void> {
  const trimmed = token_id.trim();
  if (trimmed.length === 0) return;
  if (state.token === trimmed) return;
  const fixed_side = state.fixed_side;
  const fixed_amount = fixed_side === "human" ? state.human : state.unit;
  set_state_fun({
    ...state,
    token: trimmed,
    token_info: null,
    human: fixed_side === "human" ? fixed_amount : "",
    unit: fixed_side === "unit" ? fixed_amount : "",
    error: null,
  });
  SHIT_1170_APP_PAGE_UNIT_CONVERSION_URL.write(
    trimmed,
    fixed_side === "human" ? fixed_amount : null,
    fixed_side === "unit" ? fixed_amount : null,
  );
  await load_token_fun(trimmed);
  // the derived box is rebuilt with the new token's decimals.
  const decimals = state.token_info?.decimals ?? null;
  if (decimals === null) return;
  const derived = derive_fun(fixed_side, fixed_amount, decimals);
  set_state_fun({ ...state, human: derived.human, unit: derived.unit });
  write_url_fun(derived.human, derived.unit);
}
// ========================================
// the reader typed an amount, in one of the two boxes.
//
// --- WHY THE SIDE IS SET HERE AND NOT BY THE CALLER: typing into a box
// IS the reader saying which side they fixed. the box that was typed
// into is the reader's number, and the other box is the conversion of
// it.
//
// --- WHY THE URL CARRIES BOTH SIDES: the link says what the screen
// shows, and the screen shows two boxes. the typed side is written as
// the reader left it, and the derived side is written when it cannot be
// derived — so a copied link opens the same pair of figures.
function set_amount_fun(side: "human" | "unit", amount: string): void {
  const decimals = state.token_info?.decimals ?? null;
  const derived = derive_fun(side, amount, decimals);
  set_state_fun({
    ...state,
    human: derived.human,
    unit: derived.unit,
    fixed_side: side,
  });
  write_url_fun(derived.human, derived.unit);
}
// ========================================
// ========================================
// --- READ ------------------------------
function get_fun(): SHIT_1170_APP_PAGE_UNIT_CONVERSION_STATE {
  return state;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_UNIT_CONVERSION_STORE = {
  load: load_fun,
  set_token: set_token_fun,
  set_amount: set_amount_fun,
  subscribe: subscribe_fun,
  get: get_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
