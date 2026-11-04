// ========================================
// the unit conversion page's url parameters: `?ca=`, `?human=` and `?unit=`.
//
// the unit conversion page holds ONE token — the contract address it converts
// — so the token travels in `?ca=`, the name the ecosystem uses for a
// token's contract address.
//
// --- WHY `?ca=` AND NOT THE SHARED `?id=` READER: that reader is for a
// page that is ABOUT one thing — a token's page, an account, a dao. a
// link to the unit conversion page says which token it converts, and `ca` says
// that in the word the reader already knows from the ecosystem.
//
// --- WHY THE AMOUNTS HAVE TWO PARAMETERS: the page has TWO amount
// boxes — the human one and the unit one — and the reader types into
// EITHER of them. both carry the same amount, and the link carries both
// so it says the same thing the screen does.
//
// --- WHY THE UNIT PARAMETER IS WRITTEN TOO: the human amount ("1.5") is
// only meaningful next to the token's decimals — "1.5" of an
// eighteen-decimal token and "1.5" of a six-decimal one are different
// numbers of the smallest unit. the unit amount is the EXACT number the
// chain would trade, so the link carries it alongside the human one and
// a reload lands on the same figures whatever the token's decimals are.
//
// --- WHY `?unit=` WINS WHEN BOTH ARE SET: the two parameters are kept
// in step on every write, so a link carrying both is normally a link
// that says one thing twice. when they disagree — a hand-edited link —
// the unit amount is the one that is exact, so it is the one the page
// answers.
//
// --- WHY IT IMPORTS NOTHING: the rule is the whole of it.
const URL_CA_PARAM = "ca";
const URL_HUMAN_PARAM = "human";
const URL_UNIT_PARAM = "unit";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// trim a raw url value, treating blank as absent.
//
// --- WHY --- blank is treated as absent: a trailing `?ca=` link points
// at nothing, and an empty amount is not an amount.
function normalize_param_fun(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}
// ========================================
// ========================================
// --- READ ------------------------------
// the `?ca=` off the current url, or null when there is none.
function read_url_ca_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_param_fun(params.get(URL_CA_PARAM));
}
// ========================================
// the `?human=` off the current url, or null when there is none.
function read_url_human_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_param_fun(params.get(URL_HUMAN_PARAM));
}
// ========================================
// the `?unit=` off the current url, or null when there is none.
function read_url_unit_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_param_fun(params.get(URL_UNIT_PARAM));
}
// ========================================
// the amounts the url carries, and which one the reader fixed.
//
// --- WHY --- THE SIDE COMES FROM WHICH PARAMETER IS SET: the box the
// reader typed into is the side they fixed, and the link says which one
// by carrying both — the one that is absent is the one the page
// derives. when both are set (they normally are, because both are
// written), the unit amount is the exact one, so the unit side is the
// fixed one.
export interface SHIT_1170_UNIT_CONVERSION_URL_AMOUNTS {
  // the human amount, or null when the url carries none.
  human: string | null;
  // the unit amount, or null when the url carries none.
  unit: string | null;
  // the side the reader fixed.
  side: "human" | "unit";
}
function read_url_amounts_fun(): SHIT_1170_UNIT_CONVERSION_URL_AMOUNTS {
  const human = read_url_human_fun();
  const unit = read_url_unit_fun();
  if (unit !== null) return { human, unit, side: "unit" };
  if (human !== null) return { human, unit, side: "human" };
  return { human: null, unit: null, side: "human" };
}
// ========================================
// ========================================
// --- WRITE -----------------------------
// put the unit conversion page's parameters on the url, without a reload.
//
// --- WHY --- `replaceState` and not `pushState`: every keystroke
// writes the url, and a history entry per keystroke would fill the back
// button with every prefix of the number the reader typed.
//
// --- WHY --- A NULL AMOUNT TAKES ITS PARAMETER OFF: the reader clearing
// a box means the url no longer carries that amount, and a link with a
// stale amount on it would open the page with a number the reader
// erased.
//
// --- WHY --- BOTH AMOUNTS ARE WRITTEN TOGETHER: the two boxes are two
// views of ONE amount, so the link is written as a pair — the typed
// side and the derived side, or the surviving side alone when the
// derivation failed.
function write_url_fun(
  ca: string | null,
  human: string | null,
  unit: string | null,
): void {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  const values: Record<string, string | null> = {
    [URL_CA_PARAM]: normalize_param_fun(ca),
    [URL_HUMAN_PARAM]: normalize_param_fun(human),
    [URL_UNIT_PARAM]: normalize_param_fun(unit),
  };
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
export const SHIT_1170_APP_PAGE_UNIT_CONVERSION_URL = {
  read_ca: read_url_ca_fun,
  read_amounts: read_url_amounts_fun,
  write: write_url_fun,
  normalize: normalize_param_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
