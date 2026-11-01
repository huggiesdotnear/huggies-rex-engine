// ========================================
// read the `?tab=` off the current url, the one way.
//
// the account page has a tab bar and the tab lives in the url, so a
// reader can link to the transactions tab directly and a reload of that
// link lands on the same tab.
//
// --- WHY --- it lives in lib/ts and not in the account page's own
// file: the rule is the same one lib/ts/url_id.ts holds for `?id=` —
// trimmed, and blank treated as absent — and a second copy of it is a
// second chance to drift. so the READING is shared here and the
// account page owns only which tab names it has.
//
// --- WHY --- it imports nothing: the rule is the whole of it, so it
// must not drag a page's own module in with it.
const URL_TAB_PARAM = "tab";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// trim the raw `?tab=` value, treating blank as absent.
//
// --- WHY --- blank is treated as absent: a trailing `?tab=` link points
// at the default tab, not at a tab named "".
function normalize_tab_fun(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed.toLowerCase();
}
// ========================================
// ========================================
// --- READ ------------------------------
// the `?tab=` off the current url, or null when there is none.
//
// --- WHY --- window checks: the module is imported by a start script
// that runs in the browser, but the ts is also loaded in tests and on
// the server, where there is no window.
function read_url_tab_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_tab_fun(params.get(URL_TAB_PARAM));
}
// ========================================
// ========================================
// --- HREF ------------------------------
// the url of a tab, as a link the reader can copy or open in a new tab.
//
// --- WHY --- THE HREF AND THE URL ARE BUILT THE SAME WAY: the link a
// reader copies has to be the url they get when they click it. so
// both come from here, and neither of them decides on its own what
// the url looks like.
//
// --- WHY --- THE OTHER PARAMETERS ARE KEPT: the url carries the
// account the reader is looking at, and a tab link that dropped it
// would take the account away.
function build_url_tab_fun(tab: string): string {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return "";
  }
  const url = new URL(window.location.href);
  url.searchParams.set(URL_TAB_PARAM, tab);
  // the path and the search only — the hash is not part of the page's
  // own state.
  return `${url.pathname}${url.search}`;
}
// ========================================
// ========================================
// --- WRITE ------------------------------
// write a tab to the url, without reloading the page.
//
// --- WHY --- the url is rewritten with history.replaceState and NOT
// with a navigation: a tab bar switches a view of the page that is
// already loaded, and a navigation would throw the page away and make
// it fetch everything again. the reader switched tab, not page.
//
// --- WHY --- replaceState and not pushState: the tab bar is a switch
// between two views of ONE page, so it is not a step back in the
// browser's history. the back button leaves the page rather than walk
// the tabs. and replaceState means a reload of the url lands on the
// same tab, so a tab can still be linked to.
//
// --- WHY --- the `?id=` (or whatever else) is kept: the tab bar only
// owns the `?tab=` parameter, and dropping the rest of the url would
// take the account the reader is looking at with it.
function write_url_tab_fun(tab: string): void {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set(URL_TAB_PARAM, tab);
  // --- WHY --- the history check: a page opened from a file:// url or
  // in an environment without history would throw here, and the tab
  // must still switch.
  if (
    typeof window.history !== "undefined" &&
    typeof window.history.replaceState === "function"
  ) {
    window.history.replaceState(null, "", url.toString());
    return;
  }
  window.location.replace(url.toString());
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// the reader/writer surface. exported as one object so callers have a
// single import.
export const HUGGIES_URL_TAB = {
  read: read_url_tab_fun,
  write: write_url_tab_fun,
  href: build_url_tab_fun,
  normalize: normalize_tab_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
