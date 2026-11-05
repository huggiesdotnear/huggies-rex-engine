// ========================================
// the feed page's shapes: the filter it holds, and the state it shows.
//
// the types live in their own file so the store, the loader, the url
// and the components can all speak about the same things without one
// of them importing another.
import type {
  SHIT_1170_SWAP_QUEUE,
  SHIT_1170_TX_QUEUE,
  SHIT_1170_TX_QUEUE_FACETS,
} from "@huggies/shit-1170-rex-engine-middleman";
import type { SHIT_1170_SWAP_QUOTE } from "../shared/swap_quote";
// ========================================
// ========================================
// --- TYPES ------------------------------
// how the list is ordered.
//
// --- WHY --- it is a named set and not a direction: the feed offers
// "date added" and "most popular" — two entries, not two directions of
// one key. so the sort control is a pair of buttons and a direction
// toggle beside them.
export type SHIT_1170_FEED_SORT = "date_added" | "most_popular";

// which kind of post the feed shows.
//
// --- WHY --- it is a union and not a boolean: the feed shows two kinds
// of thing — the queued batches and the queued swaps — and ALL is a
// third thing and not the absence of a choice.
export type SHIT_1170_FEED_TYPE = "all" | "calls" | "swaps";

// which way round the list is ordered.
//
// --- WHY --- it is a union and not a boolean: "asc" and "desc" are the
// two words the url and the sort control use, and one set of words for
// one set of states is easier to read than two.
export type SHIT_1170_FEED_DIRECTION = "asc" | "desc";

// the whole state of the feed page.
export interface SHIT_1170_APP_PAGE_FEED_STATE {
  // true when the queues the reader has already sent are hidden.
  hide_sent: boolean;
  // how the list is ordered.
  sort: SHIT_1170_FEED_SORT;
  // which way round the list is ordered.
  direction: SHIT_1170_FEED_DIRECTION;
  // which kind of post the feed shows.
  type: SHIT_1170_FEED_TYPE;
  // the contracts the feed is narrowed to. an empty list is EVERY
  // contract.
  contracts: ReadonlyArray<string>;
  // the accounts the feed is narrowed to. an empty list is EVERY
  // account.
  accounts: ReadonlyArray<string>;
  // the queues on screen.
  queues: ReadonlyArray<SHIT_1170_TX_QUEUE>;
  // the queued swaps on screen.
  swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>;
  // the live quote of each swap, in the SAME order as `swaps`. an entry
  // is null when the router could not answer, and the swap then shows
  // the quote the backend stored.
  swap_quotes: ReadonlyArray<SHIT_1170_SWAP_QUOTE | null>;
  // how many queued transactions the whole match holds, BEFORE the
  // cursor took its cut.
  //
  // --- WHY --- IT DOES NOT CHANGE AS THE READER PAGES: the total is
  // the count of the WHOLE match, so it is how many there are and not
  // how many are on screen.
  total: number;
  // the cursor of the NEXT page of queued BATCHES, or null when there
  // is no next page.
  //
  // --- WHY --- THE TWO CURSORS ARE SEPARATE: the batches and the swaps
  // are two lists with two tables, and the api hands each one its own
  // opaque cursor. one list's cursor cannot be sent to the other.
  next_cursor: string | null;
  // the cursor of the NEXT page of queued SWAPS, or null when there is
  // no next page.
  swaps_cursor: string | null;
  // true while the next page is on its way.
  loading_more: boolean;
  // the contracts and the accounts that have queued work, so the
  // filter bar can offer a button for each of them.
  facets: SHIT_1170_TX_QUEUE_FACETS | null;
  // true while a load is running.
  loading: boolean;
  // the message for the reader, when something failed.
  error: string | null;
}
// ========================================
// --- DEFAULTS --------------------------
// the switch the page opens on.
//
// --- WHY --- IT IS OFF: a reader who has not asked to hide the queues
// they sent sees everything, and the switch is one click away.
const SHIT_1170_FEED_DEFAULT_HIDE_SENT = false;
// the sort the page opens on.
const SHIT_1170_FEED_DEFAULT_SORT: SHIT_1170_FEED_SORT = "date_added";
// the direction the page opens on.
//
// --- WHY --- DESC IS THE DEFAULT: a feed of queued work reads
// newest-first, and the oldest thing in the queue is the thing that has
// waited longest.
const SHIT_1170_FEED_DEFAULT_DIRECTION: SHIT_1170_FEED_DIRECTION = "desc";
// the kind of post the page opens on.
const SHIT_1170_FEED_DEFAULT_TYPE: SHIT_1170_FEED_TYPE = "all";
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_DEFAULTS = {
  hide_sent: SHIT_1170_FEED_DEFAULT_HIDE_SENT,
  sort: SHIT_1170_FEED_DEFAULT_SORT,
  direction: SHIT_1170_FEED_DEFAULT_DIRECTION,
  type: SHIT_1170_FEED_DEFAULT_TYPE,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
