// ========================================
// the feed page's shapes: the filter it holds, and the state it shows.
//
// the types live in their own file so the store, the loader, the url
// and the components can all speak about the same things without one
// of them importing another.
import type { SHIT_1170_TX_QUEUE } from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the view the reader is looking at.
//
// --- WHY --- it is a union and not a boolean: "mine" and "all" are two
// views and not a state of one thing, and the filter bar draws two
// buttons for them. a boolean would make every reader of the store
// decide which way round it is.
export type SHIT_1170_FEED_VIEW = "all" | "mine";

// how the list is ordered.
//
// --- WHY --- it is a named set and not a direction: the feed offers
// "newest" and "most accounts" — two entries, not two directions of
// one key. so the sort control is a plain dropdown.
export type SHIT_1170_FEED_SORT = "newest" | "most_accounts";

// the whole state of the feed page.
export interface SHIT_1170_APP_PAGE_FEED_STATE {
  // the view the reader is in: every queue, or only the ones they are
  // on.
  view: SHIT_1170_FEED_VIEW;
  // the account the view is about, or null for the ALL view.
  account_id: string | null;
  // true when the queues the reader has already sent are hidden.
  hide_sent: boolean;
  // how the list is ordered.
  sort: SHIT_1170_FEED_SORT;
  // the queues on screen.
  queues: ReadonlyArray<SHIT_1170_TX_QUEUE>;
  // true while a load is running.
  loading: boolean;
  // the message for the reader, when something failed.
  error: string | null;
}
// ========================================
// ========================================
// --- DEFAULTS --------------------------
// the view the page opens on.
//
// --- WHY --- MINE IS THE DEFAULT WHEN THE READER IS SIGNED IN: a
// reader who signs in wants their own queue. a reader who is signed
// out gets all of it, because they have no queue of their own.
const SHIT_1170_FEED_DEFAULT_VIEW: SHIT_1170_FEED_VIEW = "all";
// the sort the page opens on.
const SHIT_1170_FEED_DEFAULT_SORT: SHIT_1170_FEED_SORT = "newest";
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_DEFAULTS = {
  view: SHIT_1170_FEED_DEFAULT_VIEW,
  sort: SHIT_1170_FEED_DEFAULT_SORT,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
