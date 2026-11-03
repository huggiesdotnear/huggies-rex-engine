// ========================================
// the swap page's url parameters: `?in=`, `?out=`, `?amount_in=` and
// `?amount_out=`.
//
// the swap page holds TWO tokens, so it needs TWO url parameters. they
// are named `in` and `out` rather than a single `?id=`, because a link
// to a swap says what it swaps: `swap.html?in=near&out=usdt.tether-token.near`.
//
// --- WHY IT DOES NOT REUSE THE SHARED `?id=` READER: that reader is
// for a page that holds ONE thing — a token, an account, a dao. the
// swap page holds two, and two named parameters are clearer in a link
// than one parameter that changes meaning depending on the page.
//
// --- WHY THE AMOUNTS HAVE THEIR OWN PARAMETERS AND NOT ONE `?amount=`:
// the page has TWO amount boxes and the reader types into EITHER of
// them. the box they typed into is the side they are fixing, and the
// router is asked about that side. so the url says which box the number
// belongs to by the name of the parameter that holds it: `?amount_in=`
// is the input box and `?amount_out=` is the output box.
//
// --- WHY THE TWO AMOUNT PARAMETERS ARE NEVER BOTH SET: the two boxes
// are two views of ONE quote. the reader fixes one side and the router
// answers the other, so only the side they fixed has a number to keep.
// a link carrying both would be a link saying two different questions
// at once, and the page would have to pick one to answer.
//
// --- WHY THE URL CARRIES THE UNIT AMOUNT AND NOT THE HUMAN ONE: the
// unit amount is the EXACT number the chain and the router trade, and
// it is the same number whatever the token's decimals are. a human
// amount ("1.5") is only meaningful next to the token it belongs to —
// "1.5 NEAR" and "1.5 USDC" are different trades, and "1.5" of a token
// with six decimals is a different number of units than "1.5" of one
// with eighteen. so a link that says `?amount_in=1.5` cannot be read
// without knowing which token the link means, and the unit amount
// says it on its own. it also matches what the router is asked, so the
// number that travels in the link is the number that trades.
//
// --- WHY IT IMPORTS NOTHING: the rule is the whole of it.
const URL_IN_PARAM = "in";
const URL_OUT_PARAM = "out";
const URL_AMOUNT_IN_PARAM = "amount_in";
const URL_AMOUNT_OUT_PARAM = "amount_out";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// trim a raw url value, treating blank as absent.
//
// --- WHY --- blank is treated as absent: a trailing `?in=` link points
// at nothing, and rendering an empty token would be worse than saying
// the token is missing.
function normalize_token_id_fun(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}
// ========================================
// ========================================
// --- READ ------------------------------
// the `?in=` off the current url, or null when there is none.
function read_url_in_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_token_id_fun(params.get(URL_IN_PARAM));
}
// ========================================
// the `?out=` off the current url, or null when there is none.
function read_url_out_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_token_id_fun(params.get(URL_OUT_PARAM));
}
// ========================================
// the `?amount_in=` off the current url, or null when there is none.
//
// --- WHY --- blank is treated as absent, the same as the tokens: a
// trailing `?amount_in=` link points at nothing, and an empty amount is
// not an amount.
function read_url_amount_in_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_token_id_fun(params.get(URL_AMOUNT_IN_PARAM));
}
// ========================================
// the `?amount_out=` off the current url, or null when there is none.
function read_url_amount_out_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_token_id_fun(params.get(URL_AMOUNT_OUT_PARAM));
}
// ========================================
// the unit amount the url carries and the side it belongs to.
//
// --- WHY --- THE SIDE IS READ FROM THE PARAMETER NAME AND NOT FROM A
// FLAG: the name IS the side. `?amount_in=` is the input box and
// `?amount_out=` is the output box, so a link that says "1.5 of NEAR in"
// needs no second parameter saying "in".
//
// --- WHY --- THE IN SIDE WINS WHEN BOTH ARE SET: a link that carries
// both is a link asking two questions at once, and the page answers
// one. the input side is the side the reader types into first, so it
// is the one that is answered.
//
// --- WHY --- THE AMOUNT IS THE UNIT AMOUNT AND NOT THE HUMAN ONE: see
// the note at the top of the file. the caller turns it into the human
// amount the box shows, using the token's decimals.
export interface SHIT_1170_SWAP_URL_AMOUNT {
  // the unit amount, or null when the url carries none.
  unit: string | null;
  // the side the amount belongs to.
  side: "in" | "out";
}
function read_url_amount_fun(): SHIT_1170_SWAP_URL_AMOUNT {
  const amount_in = read_url_amount_in_fun();
  if (amount_in !== null) return { unit: amount_in, side: "in" };
  const amount_out = read_url_amount_out_fun();
  if (amount_out !== null) return { unit: amount_out, side: "out" };
  return { unit: null, side: "in" };
}
// ========================================
// ========================================
// --- WRITE -----------------------------
// put both tokens on the url, without a reload.
//
// --- WHY --- `replaceState` and not `pushState`: picking a token is a
// refinement of the same view, not a new page the reader can go back
// through. a history entry per token pick fills the back button with
// a stack of half-finished swaps.
//
// --- WHY --- the OTHER token is kept: a swap link is worth keeping
// whole. dropping `?out=` when only `?in=` changed would leave a link
// that swapped to nothing.
function write_url_tokens_fun(
  token_in: string | null,
  token_out: string | null,
): void {
  write_url_fun({
    [URL_IN_PARAM]: token_in,
    [URL_OUT_PARAM]: token_out,
  });
}
// ========================================
// put the reader's amount on the url, and take the OTHER side's amount
// off it.
//
// --- WHY --- THE AMOUNT IS THE UNIT AMOUNT: the url carries the exact
// number of the token's smallest unit that trades — the same number the
// router is asked about. see the note at the top of the file.
//
// --- WHY --- THE OTHER SIDE'S AMOUNT GOES: the two boxes are two views of
// ONE quote. when the reader types into the input box, the output box
// shows the router's answer, and that answer is not the reader's number.
// keeping the old `?amount_out=` on the url would leave a link saying
// "I want this much OUT" on a page where the reader fixed the input.
//
// --- WHY --- `replaceState` and not `pushState`: the amount changes on
// every keystroke, and a history entry per keystroke would fill the
// back button with every prefix of the number the reader typed.
function write_url_amount_fun(side: "in" | "out", unit: string | null): void {
  const trimmed = unit === null ? null : unit.trim();
  const empty = trimmed === null || trimmed.length === 0;
  if (side === "in") {
    write_url_fun({
      [URL_AMOUNT_IN_PARAM]: empty ? null : trimmed,
      [URL_AMOUNT_OUT_PARAM]: null,
    });
    return;
  }
  write_url_fun({
    [URL_AMOUNT_IN_PARAM]: null,
    [URL_AMOUNT_OUT_PARAM]: empty ? null : trimmed,
  });
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// put a set of parameters on the url, without a reload. a null value
// takes the parameter off the url.
//
// --- WHY --- ONE HELPER FOR BOTH WRITES: the two writers must not drift
// on how they touch `window.history`, and a reader looking for the url
// rules should find them in one place.
function write_url_fun(values: Record<string, string | null>): void {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  }
  window.history.replaceState(null, "", url.toString());
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_SWAP_URL = {
  read_in: read_url_in_fun,
  read_out: read_url_out_fun,
  read_amount: read_url_amount_fun,
  write: write_url_tokens_fun,
  write_amount: write_url_amount_fun,
  normalize: normalize_token_id_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
