// ========================================
// the feed's filter bar: ALL / MINE, HIDE SENT and the sort.
//
// it reads the filter from the store and writes it back through the
// store's setters.
//
// --- WHY IT DOES NOT FETCH: the ts files fetch, the components
// display. the filter bar changes a filter, the store re-reads the feed,
// and the bar never talks to the api.
//
// --- WHY THE SORT IS A PLAIN DROPDOWN AND NOT THE SHARED SORT CONTROL:
// the shared control is a row of small buttons with a direction toggle.
// the feed's sort is a named set with no direction — "newest" and "most
// accounts" are two entries, not two directions of one key.
//
// mounts into <div id="SHIT_1170_COMPONENT_APP_PAGE_FEED_FILTERS">.
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_FEED_STORE } from "../../ts/feed/app_page_feed_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { SHIT_1170_AUTH } from "../../ts/shared/auth_status";
import type { SHIT_1170_FEED_SORT } from "../../ts/feed/app_page_feed_types";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the sorts the dropdown offers.
interface SHIT_1170_FEED_SORT_OPTION {
  key: SHIT_1170_FEED_SORT;
  label: string;
}

// --- WHY THE LABELS ARE UPPERCASE: the app's controls are uppercase
// everywhere, and a mixed-case label next to an uppercase button reads
// as a different thing.
const SHIT_1170_FEED_SORT_OPTIONS: ReadonlyArray<SHIT_1170_FEED_SORT_OPTION> = [
  { key: "newest", label: "NEWEST" },
  { key: "most_accounts", label: "MOST ACCOUNTS" },
];
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_APP_PAGE_FEED_FILTERS_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_FEED_STORE);
  const signed_in = SHIT_1170_AUTH.is_signed_in();
  // --- WHY --- THE MINE BUTTON IS DISABLED WHEN NOBODY IS SIGNED IN:
  // the MINE view is the reader's own queues, and a reader with no
  // account has none. a button that cannot work is noise.
  const mine_disabled = !signed_in;
  // --- WHY --- HIDE SENT IS DISABLED IN THE ALL VIEW: "has this
  // account sent it" is a question about ONE account, and the ALL view
  // has none. the control is greyed out and the url's hide_sent is
  // ignored.
  const hide_sent_disabled = state.view !== "mine";

  return (
    <div class="feed-filters">
      <div class="feed-filters-toggle" role="group" aria-label="whose queues">
        <button
          type="button"
          class={
            state.view === "all"
              ? "feed-filter-button is-active"
              : "feed-filter-button"
          }
          aria-pressed={state.view === "all"}
          onClick={() => {
            void SHIT_1170_APP_PAGE_FEED_STORE.set_view("all");
          }}
        >
          ALL
        </button>
        <button
          type="button"
          class={
            state.view === "mine"
              ? "feed-filter-button is-active"
              : "feed-filter-button"
          }
          aria-pressed={state.view === "mine"}
          disabled={mine_disabled}
          onClick={() => {
            void SHIT_1170_APP_PAGE_FEED_STORE.set_view("mine");
          }}
        >
          MINE
        </button>
      </div>
      <button
        type="button"
        class={
          state.hide_sent
            ? "feed-filter-button is-active"
            : "feed-filter-button"
        }
        aria-pressed={state.hide_sent}
        disabled={hide_sent_disabled}
        onClick={() => {
          void SHIT_1170_APP_PAGE_FEED_STORE.set_hide_sent(!state.hide_sent);
        }}
        title={
          hide_sent_disabled
            ? "hiding what you sent needs your own view"
            : "hide the queues you have already sent"
        }
      >
        HIDE SENT
      </button>
      <label class="feed-filters-sort">
        <span class="feed-filters-sort-label">SORT</span>
        <select
          class="feed-filters-select"
          value={state.sort}
          onChange={(event) => {
            const next = (event.currentTarget as HTMLSelectElement)
              .value as SHIT_1170_FEED_SORT;
            SHIT_1170_APP_PAGE_FEED_STORE.set_sort(next);
          }}
        >
          {SHIT_1170_FEED_SORT_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_APP_PAGE_FEED_FILTERS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<SHIT_1170_COMPONENT_APP_PAGE_FEED_FILTERS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
