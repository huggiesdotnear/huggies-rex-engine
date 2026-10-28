// ========================================
// the shared sort control used by every sortable list.
// ========================================
import { ArrowDown, ArrowUp } from "lucide-preact";
import {
  HUGGIES_TOKEN_SORTS,
  type HUGGIES_TOKEN_SORT,
  type HUGGIES_TOKEN_SORT_DIRECTION,
} from "../../ts/app_page_discover_token_sort";
// ========================================
// render the sort options as a row of buttons, plus a direction toggle.
export function huggies_sort_control_fun(props: {
  sort: HUGGIES_TOKEN_SORT;
  direction: HUGGIES_TOKEN_SORT_DIRECTION;
  on_sort: (sort: HUGGIES_TOKEN_SORT) => void;
  on_direction: (direction: HUGGIES_TOKEN_SORT_DIRECTION) => void;
  class?: string;
}): preact.JSX.Element {
  const Icon = props.direction === "desc" ? ArrowDown : ArrowUp;
  return (
    <div class={`sort-control ${props.class ?? ""}`.trim()}>
      {HUGGIES_TOKEN_SORTS.map((option) => (
        <button
          type="button"
          class={
            option.key === props.sort ? "sort-button is-active" : "sort-button"
          }
          aria-pressed={option.key === props.sort}
          onClick={() => props.on_sort(option.key)}
        >
          {option.label}
        </button>
      ))}
      <button
        type="button"
        class="sort-button sort-direction"
        onClick={() =>
          props.on_direction(props.direction === "desc" ? "asc" : "desc")
        }
        aria-label={
          props.direction === "desc" ? "sort ascending" : "sort descending"
        }
        title={props.direction === "desc" ? "descending" : "ascending"}
      >
        <Icon size={13} />
        {props.direction === "desc" ? "DESC" : "ASC"}
      </button>
    </div>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
