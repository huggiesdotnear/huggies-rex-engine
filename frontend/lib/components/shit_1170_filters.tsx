// ========================================
// the holder-type filter tabs on the $SHIT page: one emoji per holder
// type.
//
// it reads the active filter from the page's store and writes the
// reader's pick back to it. it fetches nothing.
//
// the tooltip on each tab is what the legend used to say — hovering the
// emoji explains what that group of holders is.
import { render } from "preact";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKENS_PAGE_SHIT_1170_STATE } from "../ts/tokens_page_shit_1170_state";
import { HUGGIES_SHIT_FILTERS } from "../ts/tokens_page_shit_1170_filters";
import type { HUGGIES_SHIT_ACTIVE_FILTER } from "../ts/tokens_page_shit_1170_state";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_SHIT_1170_FILTERS_FUN() {
  const [, set_revision] = use_state(0);

  use_effect(() => {
    const unsubscribe = HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const active_filter = HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.get().active_filter;

  return (
    <div class="huggies-shit-tabs" role="tablist" aria-label="holder types">
      {HUGGIES_SHIT_FILTERS.map((filter) => (
        <button
          type="button"
          role="tab"
          class={
            filter.key === active_filter
              ? "huggies-shit-tab is-active"
              : "huggies-shit-tab"
          }
          aria-selected={filter.key === active_filter}
          aria-label={filter.label}
          title={`${filter.label} — ${filter.description}`}
          onClick={() =>
            HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.set_active_filter(
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
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_SHIT_1170_FILTERS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_SHIT_1170_FILTERS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
