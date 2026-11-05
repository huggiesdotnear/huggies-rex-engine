// ========================================
// the feed's SAVED filter: the filters the reader saved, kept in the
// browser's own storage so the feed opens the way they left it.
//
// --- WHY THE FILTERS ARE SAVED AT ALL: the feed's filters are a
// reading habit, not a link. a reader who only ever looks at the swaps
// of one contract should not have to pick it again every morning, and
// the url cannot carry that — the url is for SHARING a view, and the
// saved filter is for KEEPING one.
//
// --- WHY THE STORAGE KEY IS PREFIXED: the app's own keys all start
// with SHIT_1170_, so a near-connect write cannot land on ours.
//
// --- WHY EVERY VALUE IS VALIDATED ON THE READ: localStorage is
// writable by hand and by anything else on the page. a half written
// entry must never crash the app and must never be applied as if it
// were valid — so every field is checked, and a bad field falls back
// to the default instead of being carried along.
import type {
  SHIT_1170_FEED_DIRECTION,
  SHIT_1170_FEED_SORT,
  SHIT_1170_FEED_TYPE,
} from "./app_page_feed_types";
// ========================================
// --- CONFIG -----------------------------
// where the saved filter lives.
const SHIT_1170_FEED_SAVED_STORAGE_KEY = "SHIT_1170_APP_PAGE_FEED_FILTER";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the filters the reader saved.
export interface SHIT_1170_APP_PAGE_FEED_SAVED {
  // true when the queues the reader has already sent were hidden.
  hide_sent: boolean;
  // how the list is ordered.
  sort: SHIT_1170_FEED_SORT;
  // which way round the list is ordered.
  direction: SHIT_1170_FEED_DIRECTION;
  // which kind of post the feed shows.
  type: SHIT_1170_FEED_TYPE;
  // the contracts the feed is narrowed to.
  contracts: ReadonlyArray<string>;
  // the accounts the feed is narrowed to.
  accounts: ReadonlyArray<string>;
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// is this a sort the feed offers?
//
// --- WHY --- the checks live HERE and not in the filter module: the
// filter module reads the url and knows the sets, and this module must
// be able to say "no" to a hand edited value without dragging the url
// in with it.
function is_known_sort_fun(value: unknown): value is SHIT_1170_FEED_SORT {
  return value === "date_added" || value === "most_popular";
}

// is this a direction the feed offers?
function is_known_direction_fun(
  value: unknown,
): value is SHIT_1170_FEED_DIRECTION {
  return value === "asc" || value === "desc";
}

// is this a type the feed offers?
function is_known_type_fun(value: unknown): value is SHIT_1170_FEED_TYPE {
  return value === "all" || value === "calls" || value === "swaps";
}

// the list of ids off a saved value, or null when it is not a list of
// strings.
//
// --- WHY --- EVERY ENTRY IS CHECKED: one number in the list would
// otherwise ride out of the read as a number, and the api would be
// asked for a contract id that is not one.
function normalize_ids_fun(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const ids: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") return null;
    const trimmed = entry.trim();
    if (trimmed.length === 0) continue;
    if (!ids.includes(trimmed)) ids.push(trimmed);
  }
  return ids;
}

// the saved filter, or null when the entry is not one.
function normalize_saved_fun(
  value: unknown,
): SHIT_1170_APP_PAGE_FEED_SAVED | null {
  if (typeof value !== "object" || value === null) return null;
  const saved = value as Partial<SHIT_1170_APP_PAGE_FEED_SAVED>;
  if (!is_known_sort_fun(saved.sort)) return null;
  if (!is_known_direction_fun(saved.direction)) return null;
  if (!is_known_type_fun(saved.type)) return null;
  if (typeof saved.hide_sent !== "boolean") return null;
  const contracts = normalize_ids_fun(saved.contracts);
  const accounts = normalize_ids_fun(saved.accounts);
  if (contracts === null || accounts === null) return null;
  return {
    hide_sent: saved.hide_sent,
    sort: saved.sort,
    direction: saved.direction,
    type: saved.type,
    contracts,
    accounts,
  };
}
// ========================================
// ========================================
// --- READ ------------------------------
// the saved filter, or null when there is none worth using.
//
// --- WHY THE WHOLE ENTRY IS DROPPED WHEN ONE FIELD IS BAD: a saved
// filter is one choice the reader made — the switch AND the sort AND
// the direction AND the type AND the lists. half of it is not what they
// saved, so the entry is not used at all and the feed opens on its
// defaults.
function read_saved_fun(): SHIT_1170_APP_PAGE_FEED_SAVED | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(SHIT_1170_FEED_SAVED_STORAGE_KEY);
  if (raw === null) return null;
  try {
    return normalize_saved_fun(JSON.parse(raw));
  } catch {
    return null;
  }
}
// ========================================
// ========================================
// --- WRITE -----------------------------
// save the filter, or clear it when there is none to save.
function write_saved_fun(saved: SHIT_1170_APP_PAGE_FEED_SAVED | null): void {
  if (typeof localStorage === "undefined") return;
  if (saved === null) {
    localStorage.removeItem(SHIT_1170_FEED_SAVED_STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    SHIT_1170_FEED_SAVED_STORAGE_KEY,
    JSON.stringify({
      hide_sent: saved.hide_sent,
      sort: saved.sort,
      direction: saved.direction,
      type: saved.type,
      contracts: saved.contracts,
      accounts: saved.accounts,
    }),
  );
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_SAVED = {
  read: read_saved_fun,
  write: write_saved_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
