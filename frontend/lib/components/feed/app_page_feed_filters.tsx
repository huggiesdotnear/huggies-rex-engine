// ========================================
// the feed's filter bar: the ALL / MINE shortcut, HIDE SENT, the FILTERS
// panel with the sort, the type, the contracts and the accounts, and the
// direction toggle.
//
// it reads the filter from the store and writes it back through the
// store's setters.
//
// --- WHY IT DOES NOT FETCH: the ts files fetch, the components
// display. the filter bar changes a filter, the store re-reads the feed,
// and the bar never talks to the api.
//
// --- WHY THE PANEL IS BEHIND A BUTTON: the bar has a few controls now,
// and a wall of them above every feed is noise. the reader opens the
// panel when they want to filter, and the bar stays a bar the rest of
// the time.
//
// --- WHY THE BUTTON SAYS FILTERS AND NOT ONLY THE ICON: an icon alone
// is a picture the reader has to guess at, and this bar is read by
// people on a phone. the word says what it opens.
//
// --- WHY THE GROUP LABELS ARE UPPERCASE, SMALL AND DIM: they are
// headings, not controls, and they must not look like buttons.
//
// --- WHY EVERY GROUP'S BUTTONS SHARE THE ROW EVENLY: a group is one
// row of choices, and a row of buttons of different widths does not
// read as one row. the flex makes them grow to fill the column evenly.
//
// --- WHY THE CONTRACT AND ACCOUNT ROWS SCROLL: the feed's queue can
// hold hundreds of contracts and the panel cannot be taller than the
// screen. the row scrolls, so every button is still reachable.
//
// --- WHY THE TYPE IS ALL / FUNCTION CALL / SWAPS: the feed holds two
// kinds of post, and the reader often wants one of them. the api reads
// each kind from its own route, so picking one halves the requests.
//
// --- WHY THE BAR HAS AN ALL / MINE SHORTCUT: "just mine" is a common
// ask and the ACCOUNTS group can answer it, but the group is behind the
// FILTERS button. the shortcut is in the bar and it writes the same
// accounts list the group writes, so there is one answer and not two.
import { render } from "preact";
import { useState as use_state } from "preact/hooks";
import { ArrowDown, ArrowUp, SlidersHorizontal } from "lucide-preact";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_FEED_STORE } from "../../ts/feed/app_page_feed_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { SHIT_1170_AUTH } from "../../ts/shared/auth_status";
import type {
  SHIT_1170_FEED_DIRECTION,
  SHIT_1170_FEED_SORT,
  SHIT_1170_FEED_TYPE,
} from "../../ts/feed/app_page_feed_types";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the sorts the reader picks between.
//
// --- WHY THE LABELS ARE UPPERCASE: the app's controls are uppercase
// everywhere, and a mixed-case label next to an uppercase button reads
// as a different thing.
//
// --- WHY EACH ONE SAYS WHAT IT WILL DO: the button is the one the
// reader clicks, and it says what clicking it will do.
const SHIT_1170_FEED_SORT_OPTIONS: ReadonlyArray<{
  key: SHIT_1170_FEED_SORT;
  label: string;
}> = [
  { key: "date_added", label: "DATE ADDED" },
  { key: "most_popular", label: "MOST POPULAR" },
];

// the kinds of post the reader picks between.
const SHIT_1170_FEED_TYPE_OPTIONS: ReadonlyArray<{
  key: SHIT_1170_FEED_TYPE;
  label: string;
}> = [
  { key: "all", label: "ALL" },
  { key: "calls", label: "FUNCTION CALL" },
  { key: "swaps", label: "SWAPS" },
];
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the short form of a contract or an account id.
//
// --- WHY --- THE FULL ID IS IN THE TITLE AND NOT IN THE BUTTON: the
// app's column is 500px wide and an account id is longer than that. the
// button shows enough to recognise the id and the title carries the
// whole of it, so a reader who is not sure can hover.
function short_id_fun(id: string): string {
  if (id.length <= 18) return id;
  return `${id.slice(0, 9)}…${id.slice(-6)}`;
}

// is this id in the picked list?
function has_id_fun(list: ReadonlyArray<string>, id: string): boolean {
  return list.includes(id);
}

// the picked list with one id added or taken out.
function toggle_id_fun(list: ReadonlyArray<string>, id: string): string[] {
  if (has_id_fun(list, id)) return list.filter((one) => one !== id);
  return [...list, id];
}
// ========================================
// ========================================
// --- GROUP ------------------------------
// one labelled group of buttons.
//
// --- WHY IT IS A COMPONENT AND NOT A CALL: it draws its own markup,
// and the panel has four of them. a plain call would need the same
// props four times over.
function FilterGroup(props: {
  label: string;
  // true when the group holds a list that can be long — the contracts
  // and the accounts.
  scrolls?: boolean;
  children: preact.ComponentChildren;
}) {
  return (
    <div class="feed-filter-group">
      <span class="feed-filter-label">{props.label}</span>
      <div
        class={
          props.scrolls === true
            ? "feed-filter-row is-scrolling"
            : "feed-filter-row"
        }
      >
        {props.children}
      </div>
    </div>
  );
}
// ========================================
// ========================================
// --- PANEL -----------------------------
// the filter panel: the sort, the type, the contracts, the accounts and
// the counts.
//
// --- WHY THE COUNTS ARE AT THE BOTTOM: the reader wants to know how
// much is on screen and how much there is, and that is a fact about the
// feed rather than a control. the controls sit above it and the fact
// sits under them.
//
// --- WHY THE PANEL TAKES A CALLBACK: SAVE closes the panel, and the
// panel does not own the panel's open state — the bar does. so the bar
// passes the closing in.
function FilterPanel(props: { on_saved: () => void }) {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_FEED_STORE);
  const facets = state.facets;

  // --- WHY --- THE CONTRACT AND ACCOUNT LISTS COME FROM THE FACETS: the
  // bar can only offer a button for a contract that really has queued
  // work on it, and the facets are the api's own list of those.
  const contracts = facets?.contracts ?? [];
  const accounts = facets?.accounts ?? [];

  // --- WHY --- THE READER'S OWN ACCOUNT GOES FIRST AND IS LABELLED ME:
  // an account with no queued work of its own is not in the facets, so
  // without this the reader's own account could not be picked at all.
  // and the reader should not have to recognise their own id in a long
  // row of ids — ME says it is them.
  const own_account_id = SHIT_1170_AUTH.get_account_id();
  const other_accounts = accounts.filter(
    (account) => account.accountId !== own_account_id,
  );

  return (
    <div class="feed-filter-panel">
      <FilterGroup label="SORT">
        {SHIT_1170_FEED_SORT_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            class={
              option.key === state.sort
                ? "feed-filter-button is-active"
                : "feed-filter-button"
            }
            aria-pressed={option.key === state.sort}
            onClick={() => {
              void SHIT_1170_APP_PAGE_FEED_STORE.set_sort(option.key);
            }}
          >
            {option.label}
          </button>
        ))}
      </FilterGroup>
      <FilterGroup label="TYPE">
        {SHIT_1170_FEED_TYPE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            class={
              option.key === state.type
                ? "feed-filter-button is-active"
                : "feed-filter-button"
            }
            aria-pressed={option.key === state.type}
            onClick={() => {
              void SHIT_1170_APP_PAGE_FEED_STORE.set_type(option.key);
            }}
          >
            {option.label}
          </button>
        ))}
      </FilterGroup>
      <FilterGroup label="CONTRACTS" scrolls>
        <button
          type="button"
          class={
            state.contracts.length === 0
              ? "feed-filter-button is-active"
              : "feed-filter-button"
          }
          aria-pressed={state.contracts.length === 0}
          onClick={() => {
            void SHIT_1170_APP_PAGE_FEED_STORE.set_contracts([]);
          }}
        >
          ALL
        </button>
        {contracts.map((contract) => (
          <button
            key={contract.contractId}
            type="button"
            class={
              has_id_fun(state.contracts, contract.contractId)
                ? "feed-filter-button is-active"
                : "feed-filter-button"
            }
            aria-pressed={has_id_fun(state.contracts, contract.contractId)}
            title={contract.contractId}
            onClick={() => {
              void SHIT_1170_APP_PAGE_FEED_STORE.set_contracts(
                toggle_id_fun(state.contracts, contract.contractId),
              );
            }}
          >
            {short_id_fun(contract.contractId)}
          </button>
        ))}
      </FilterGroup>
      <FilterGroup label="ACCOUNTS" scrolls>
        <button
          type="button"
          class={
            state.accounts.length === 0
              ? "feed-filter-button is-active"
              : "feed-filter-button"
          }
          aria-pressed={state.accounts.length === 0}
          onClick={() => {
            void SHIT_1170_APP_PAGE_FEED_STORE.set_accounts([]);
          }}
        >
          ALL
        </button>
        {own_account_id !== null && (
          <button
            type="button"
            class={
              has_id_fun(state.accounts, own_account_id)
                ? "feed-filter-button is-active"
                : "feed-filter-button"
            }
            aria-pressed={has_id_fun(state.accounts, own_account_id)}
            title={own_account_id}
            onClick={() => {
              // --- WHY --- ME PICKS THE READER'S ACCOUNT ALONE: ME and
              // the MINE shortcut are the same choice in two places, so
              // ME sets the one account that makes the shortcut lit.
              void SHIT_1170_APP_PAGE_FEED_STORE.set_accounts([own_account_id]);
            }}
          >
            ME
          </button>
        )}
        {other_accounts.map((account) => (
          <button
            key={account.accountId}
            type="button"
            class={
              has_id_fun(state.accounts, account.accountId)
                ? "feed-filter-button is-active"
                : "feed-filter-button"
            }
            aria-pressed={has_id_fun(state.accounts, account.accountId)}
            title={account.accountId}
            onClick={() => {
              void SHIT_1170_APP_PAGE_FEED_STORE.set_accounts(
                toggle_id_fun(state.accounts, account.accountId),
              );
            }}
          >
            {short_id_fun(account.accountId)}
          </button>
        ))}
      </FilterGroup>
      {/* --- WHY --- THE COUNT IS THE POSTS ON SCREEN AND NOT THE API'S
          TOTAL: the total is the count of the WHOLE match and it does
          not change as the reader pages, so it says how much there is.
          the number on screen is how much the reader can see. */}
      <p class="feed-filter-count">
        SHOWING {state.queues.length + state.swaps.length} OF {state.total}
      </p>
      <div class="feed-filter-actions">
        <button
          type="button"
          class="feed-filter-button"
          onClick={() => {
            void SHIT_1170_APP_PAGE_FEED_STORE.clear_all();
          }}
        >
          CLEAR ALL
        </button>
        <button
          type="button"
          class="feed-filter-button"
          onClick={() => {
            SHIT_1170_APP_PAGE_FEED_STORE.save_filters();
            // --- WHY --- THE PANEL CLOSES AFTER A SAVE: the reader has
            // said "this is how I want the feed" and they want to see
            // it. a panel that stayed open would be in the way.
            props.on_saved();
          }}
        >
          SAVE
        </button>
      </div>
    </div>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_APP_PAGE_FEED_FILTERS_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_FEED_STORE);
  // --- WHY --- THE PANEL IS ITS OWN STATE AND NOT IN THE STORE: whether
  // the panel is open is a thing about THIS component on THIS screen,
  // and it is not part of the feed's filter. a reader who opens the
  // panel, filters and closes it wants the same filter the next time.
  const [panel_open, set_panel_open] = use_state(false);
  // --- WHY --- THE READER'S OWN ACCOUNT IS READ HERE: the shortcut and
  // the ME button in the accounts group are two ways to the same place,
  // and both work off the account the reader is signed in as.
  const own_account_id = SHIT_1170_AUTH.get_account_id();
  // --- WHY --- MINE IS LIT FOR THE READER'S ACCOUNT ALONE: an accounts
  // list holding their account and somebody else's is neither ALL nor
  // MINE. the reader has gone past the shortcut with the ACCOUNTS group,
  // and the shortcut says so by having neither button lit.
  const mine_active =
    own_account_id !== null &&
    state.accounts.length === 1 &&
    state.accounts[0] === own_account_id;
  const all_active = state.accounts.length === 0;

  return (
    <div class="feed-filters">
      {/* --- WHY --- THE SHORTCUT IS IN FRONT OF HIDE SENT: it is the
          quickest way to say whose queues the reader wants, and it was
          the first thing in the bar before the accounts group existed. */}
      <div class="feed-filters-toggle" role="group" aria-label="whose queues">
        <button
          type="button"
          class={
            all_active ? "feed-filter-button is-active" : "feed-filter-button"
          }
          aria-pressed={all_active}
          onClick={() => {
            void SHIT_1170_APP_PAGE_FEED_STORE.set_accounts([]);
          }}
        >
          ALL
        </button>
        <button
          type="button"
          class={
            mine_active ? "feed-filter-button is-active" : "feed-filter-button"
          }
          aria-pressed={mine_active}
          disabled={own_account_id === null}
          title={
            own_account_id === null
              ? "your own queues need you to be signed in"
              : "only the queues on your own account"
          }
          onClick={() => {
            if (own_account_id === null) return;
            void SHIT_1170_APP_PAGE_FEED_STORE.set_accounts([own_account_id]);
          }}
        >
          MINE
        </button>
      </div>
      {/* --- WHY --- HIDE SENT IS ALWAYS AVAILABLE: "has this account
          sent it" is a question about ONE account, and the account in
          play is the reader's own — the backend takes the caller's own
          account for the filter. so there is always an account to be
          about, signed in or not. */}
      <button
        type="button"
        class={
          state.hide_sent
            ? "feed-filter-button is-active"
            : "feed-filter-button"
        }
        aria-pressed={state.hide_sent}
        onClick={() => {
          void SHIT_1170_APP_PAGE_FEED_STORE.set_hide_sent(!state.hide_sent);
        }}
        title="hide the queues you have already sent"
      >
        HIDE SENT
      </button>
      <button
        type="button"
        class="feed-filter-button feed-filter-toggle"
        aria-expanded={panel_open}
        onClick={() => {
          set_panel_open(!panel_open);
        }}
        title="the sort, the type, the contracts and the accounts"
      >
        <SlidersHorizontal size={14} />
        FILTERS
      </button>
      {/* --- WHY --- THE DIRECTION IS IN THE BAR AND NOT IN THE PANEL: it
          is not one of the filters — it is the way round the sort that
          is on, and the reader wants it beside the bar at all times.
          a reader who wants the oldest first should not have to open
          the panel to say so. */}
      <button
        type="button"
        class="feed-filter-button feed-filter-direction"
        aria-label={
          state.direction === "desc" ? "sort ascending" : "sort descending"
        }
        title={state.direction === "desc" ? "DESCENDING" : "ASCENDING"}
        onClick={() => {
          const next: SHIT_1170_FEED_DIRECTION =
            state.direction === "desc" ? "asc" : "desc";
          void SHIT_1170_APP_PAGE_FEED_STORE.set_direction(next);
        }}
      >
        {state.direction === "desc" ? (
          <ArrowDown size={14} />
        ) : (
          <ArrowUp size={14} />
        )}
      </button>
      {panel_open && (
        <FilterPanel
          on_saved={() => {
            set_panel_open(false);
          }}
        />
      )}
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
