// ========================================
// the holder-type filter tabs on the $SHIT page: one emoji per holder type.
//
// it reads the active filter from the page's store and writes the reader's
// pick back to it. it fetches nothing.
//
// the tooltip on each tab is what the legend used to say — hovering the
// emoji explains what that group of holders is.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKEN_PAGE_SHIT_1170_STATE } from "../ts/token_page_shit_1170_state";
import { HUGGIES_SHIT_FILTERS } from "../ts/token_page_shit_1170_filters";
import { use_page_store_fun } from "../ts/use_page_store";
import type { HUGGIES_SHIT_ACTIVE_FILTER } from "../ts/token_page_shit_1170_state";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_FILTERS_FUN() {
  const state = use_page_store_fun(HUGGIES_TOKEN_PAGE_SHIT_1170_STATE);
  const active_filter = state.active_filter;

  return (
    <div class="tabs" role="tablist" aria-label="holder types">
      {HUGGIES_SHIT_FILTERS.map((filter) => (
        <button
          type="button"
          role="tab"
          class={`tab${filter.key === active_filter ? " is-active" : ""}`}
          aria-selected={filter.key === active_filter}
          aria-label={filter.label}
          title={`${filter.label} — ${filter.description}`}
          onClick={() =>
            HUGGIES_TOKEN_PAGE_SHIT_1170_STATE.set_active_filter(
              filter.key as HUGGIES_SHIT_ACTIVE_FILTER,
            )
          }
        >
          {filter.icon !== "" ? filter.icon : "💩"}
        </button>
      ))}
    </div>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_FILTERS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_FILTERS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
