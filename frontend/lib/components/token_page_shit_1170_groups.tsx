// ========================================
// the share of the supply each group of holders holds, on the $SHIT page.
//
// it reads the loaded holders from the page's store. it fetches nothing.
//
// the groups are a grid of flat white cards with a coloured stripe down
// the left edge for the type. the card of the ACTIVE tab is filled in.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKEN_PAGE_SHIT_1170_STATE } from "../ts/token_page_shit_1170_state";
import { HUGGIES_TOKEN_PAGE_SHIT_1170 } from "../ts/token_page_shit_1170";
import { use_page_store_fun } from "../ts/use_page_store";
import {
  shit_holder_groups_fun,
  type HUGGIES_SHIT_HOLDER_GROUP,
} from "../ts/token_page_shit_1170_holder_groups";
import {
  shit_holder_icon_fun,
  shit_holder_type_label_fun,
} from "../ts/token_page_shit_1170_holders";
// ========================================
// ========================================
// --- HELPERS ----------------------------
function render_group_fun(
  group: HUGGIES_SHIT_HOLDER_GROUP,
  is_active: boolean,
): preact.JSX.Element {
  return (
    <li class={`group is-${group.type}${is_active ? " is-active" : ""}`}>
      <span class="group-left">
        <span class="group-icon">{shit_holder_icon_fun(group.type)}</span>
        <span class="group-name">{shit_holder_type_label_fun(group.type)}</span>
      </span>
      <span class="group-right">
        <span class="group-count">{group.count.toLocaleString()}</span>
        <span class="group-percent">{group.percent_formatted}</span>
      </span>
    </li>
  );
}
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_GROUPS_FUN() {
  const state = use_page_store_fun(HUGGIES_TOKEN_PAGE_SHIT_1170_STATE);
  // the groups are the loaded holders added up per type. before the first
  // page of holders lands there is nothing to add up.
  if (state.holders.length === 0) return null;

  const groups = shit_holder_groups_fun(
    state.holders,
    HUGGIES_TOKEN_PAGE_SHIT_1170.bigint_or_zero(
      state.summary?.total_supply_raw ?? "0",
    ),
  );

  return (
    <section class="groups">
      <h2>HOLDERS BY GROUP</h2>
      <ul class="groups-list">
        {groups.map((group) =>
          render_group_fun(group, group.type === state.active_filter),
        )}
      </ul>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_GROUPS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_GROUPS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
