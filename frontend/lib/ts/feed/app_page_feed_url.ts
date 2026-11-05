// ========================================
// the feed page's url parameters: `?hide_sent=`, `?sort=`, `?type=`,
// `?contracts=`, `?accounts=` and `?dir=`.
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
const URL_ACCOUNTS_PARAM = "accounts";
const URL_CONTRACTS_PARAM = "contracts";
const URL_DIR_PARAM = "dir";
const URL_HIDE_SENT_PARAM = "hide_sent";
const URL_SORT_PARAM = "sort";
const URL_TYPE_PARAM = "type";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// trim a raw url value, treating blank as absent.
//
// --- WHY --- blank is treated as absent: a trailing `?contracts=` link
// points at nothing, and an empty contract id is not a contract.
function normalize_param_fun(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}

// the comma separated list off a url value.
//
// --- WHY --- the list is SPLIT AND TRIMMED: the api reads one comma
// separated string, and a hand written url with a space after the comma
// must not send a value with a space in it.
function normalize_list_fun(raw: string | null): string[] {
  const trimmed = normalize_param_fun(raw);
  if (trimmed === null) return [];
  const parts: string[] = [];
  for (const part of trimmed.split(",")) {
    const one = normalize_param_fun(part);
    if (one !== null) parts.push(one);
  }
  return parts;
}

// the list as the one comma separated string the api reads.
function join_list_fun(values: ReadonlyArray<string>): string {
  return values.join(",");
}
// ========================================
// ========================================
// --- READ ------------------------------
// the `?hide_sent=` off the current url, or null when the url does not
// name it.
//
// --- WHY --- ABSENT AND PRESENT ARE DIFFERENT THINGS: an absent
// `?hide_sent=` means "the url does not say", and the saved filter may
// fill it in. a `?hide_sent=1` means "hide the sent ones" and nothing
// may fill it in.
//
// --- WHY --- only the word "1" counts: the url says yes or no, and a
// "0" is a no written the long way. the reader has one switch and it
// is either on or off.
function read_url_hide_sent_fun(): boolean | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  if (!params.has(URL_HIDE_SENT_PARAM)) return null;
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

// the `?type=` off the current url.
//
// --- WHY --- an unknown type falls back to the default: the same rule
// the sort follows. a hand edited link must still open the feed.
function read_url_type_fun(
  is_known: (value: string) => boolean,
): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const raw = normalize_param_fun(params.get(URL_TYPE_PARAM));
  if (raw === null) return null;
  return is_known(raw) ? raw : null;
}

// the `?dir=` off the current url.
//
// --- WHY --- an unknown direction falls back to the default: the same
// rule the sort follows.
function read_url_dir_fun(is_known: (value: string) => boolean): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const raw = normalize_param_fun(params.get(URL_DIR_PARAM));
  if (raw === null) return null;
  return is_known(raw) ? raw : null;
}

// the `?contracts=` off the current url, or null when the url does not
// name any.
//
// --- WHY --- ABSENT AND EMPTY ARE DIFFERENT THINGS: an absent
// `?contracts=` means "the url does not say", and the saved filter may
// fill it in. a `?contracts=` with nothing in it means "every
// contract", and nothing may fill it in. so the read says which one it
// is.
function read_url_contracts_fun(): string[] | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  if (!params.has(URL_CONTRACTS_PARAM)) return null;
  return normalize_list_fun(params.get(URL_CONTRACTS_PARAM));
}

// the `?accounts=` off the current url, or null when the url does not
// name any.
function read_url_accounts_fun(): string[] | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  if (!params.has(URL_ACCOUNTS_PARAM)) return null;
  return normalize_list_fun(params.get(URL_ACCOUNTS_PARAM));
}
// ========================================
// ========================================
// --- WRITE -----------------------------
// put the feed's parameters on the url, without a reload.
//
// --- WHY `replaceState` AND NOT `pushState`: picking a filter is a
// refinement of the same page, not a new page the reader can go back
// through. a history entry per filter fills the back button with a
// stack of half-finished feeds.
//
// --- WHY THE PARAMETERS THAT ARE AT THEIR DEFAULT ARE LEFT OFF: the
// url carries only what the reader changed. a null value takes the
// parameter off the url.
//
// --- WHY THE COMMAS ARE PUT BACK AS COMMAS: the query builder encodes
// a comma as `%2C`, and a url that reads
// `accounts=sleet.near%2Calice.near` is unreadable to the person
// looking at it — the whole point of a url is that a reader can read it
// and change it. a comma is a legal character in a query string and
// needs no encoding, so it is put back after the builder has done its
// work.
//
// --- WHY ONLY THE COMMAS ARE PUT BACK: everything else the builder
// encodes is a character that really does need it — a space, a `&`, a
// `?`. the comma is the only one that is a punctuation mark the reader
// reads.
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
  window.history.replaceState(null, "", unescape_commas_fun(url.toString()));
}

// put the encoded commas back.
//
// --- WHY --- the builder encodes them because it encodes EVERYTHING
// that is not plainly safe, and a comma is plainly safe — the api reads
// the list by splitting on it.
function unescape_commas_fun(url: string): string {
  return url.replace(/%2C/gi, ",");
}

// the whole filter on the url.
function write_url_filter_fun(
  hide_sent: boolean,
  sort: string | null,
  type: string | null,
  contracts: ReadonlyArray<string>,
  accounts: ReadonlyArray<string>,
  dir: string | null,
): void {
  write_url_fun({
    [URL_HIDE_SENT_PARAM]: hide_sent ? "1" : null,
    [URL_SORT_PARAM]: normalize_param_fun(sort),
    // --- WHY --- THE TYPE, THE LISTS AND THE DIRECTION GO OUT ONLY WHEN
    // THEY ARE NOT THE DEFAULT: the url carries only what the reader
    // changed, and a link to the plain feed opens the plain feed.
    [URL_TYPE_PARAM]: normalize_param_fun(type),
    [URL_CONTRACTS_PARAM]:
      contracts.length === 0 ? null : join_list_fun(contracts),
    [URL_ACCOUNTS_PARAM]:
      accounts.length === 0 ? null : join_list_fun(accounts),
    [URL_DIR_PARAM]: normalize_param_fun(dir),
  });
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_URL = {
  read_hide_sent: read_url_hide_sent_fun,
  read_sort: read_url_sort_fun,
  read_type: read_url_type_fun,
  read_dir: read_url_dir_fun,
  read_contracts: read_url_contracts_fun,
  read_accounts: read_url_accounts_fun,
  write_filter: write_url_filter_fun,
  normalize: normalize_param_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
