// ========================================
// the feed page's url parameters: `?account=`, `?hide_sent=` and
// `?sort=`.
//
// the feed's filter LIVES IN THE URL, so a filtered feed is a link
// somebody can paste. a feed that cannot be linked is a feed that
// cannot be shared, and sharing a feed of txs is the whole point of a
// social feed.
//
// --- WHY THE DEFAULTS ARE NOT WRITTEN TO THE URL: a url that always
// carries its defaults is noisy, and a link to the plain feed should
// open the plain feed. the url only carries what the reader changed.
//
// --- WHY IT IMPORTS NOTHING: the rule is the whole of it.
const URL_ACCOUNT_PARAM = "account";
const URL_HIDE_SENT_PARAM = "hide_sent";
const URL_SORT_PARAM = "sort";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// trim a raw url value, treating blank as absent.
//
// --- WHY --- blank is treated as absent: a trailing `?account=` link
// points at nothing, and an empty account id is not an account.
function normalize_param_fun(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}
// ========================================
// ========================================
// --- READ ------------------------------
// the `?account=` off the current url, or null when there is none.
//
// --- WHY --- AN ABSENT ACCOUNT IS THE ALL VIEW: there is no account to
// filter by, so the feed shows everything.
function read_url_account_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_param_fun(params.get(URL_ACCOUNT_PARAM));
}

// the `?hide_sent=` off the current url, or null when there is none.
//
// --- WHY --- only the word "1" counts: the url says yes or no, and a
// "0" is a no written the long way. the reader has one switch and it
// is either on or off.
function read_url_hide_sent_fun(): boolean {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get(URL_HIDE_SENT_PARAM) === "1";
}

// the `?sort=` off the current url.
//
// --- WHY --- an unknown sort falls back to the default: a hand-edited
// link with a sort the page does not know must still open the feed.
function read_url_sort_fun(
  is_known: (value: string) => boolean,
): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const raw = normalize_param_fun(params.get(URL_SORT_PARAM));
  if (raw === null) return null;
  return is_known(raw) ? raw : null;
}
// ========================================
// ========================================
// --- WRITE -----------------------------
// put the feed's parameters on the url, without a reload.
//
// --- WHY `replaceState` AND NOT `pushState`: picking a filter is a
// refinement of the same view, not a new page the reader can go back
// through. a history entry per filter fills the back button with a
// stack of half-finished feeds.
//
// --- WHY THE PARAMETERS THAT ARE AT THEIR DEFAULT ARE LEFT OFF: the
// url carries only what the reader changed. a null value takes the
// parameter off the url.
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

// the whole filter on the url.
function write_url_filter_fun(
  account_id: string | null,
  hide_sent: boolean,
  sort: string | null,
): void {
  write_url_fun({
    [URL_ACCOUNT_PARAM]: normalize_param_fun(account_id),
    [URL_HIDE_SENT_PARAM]: hide_sent ? "1" : null,
    [URL_SORT_PARAM]: normalize_param_fun(sort),
  });
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_URL = {
  read_account: read_url_account_fun,
  read_hide_sent: read_url_hide_sent_fun,
  read_sort: read_url_sort_fun,
  write_filter: write_url_filter_fun,
  normalize: normalize_param_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
