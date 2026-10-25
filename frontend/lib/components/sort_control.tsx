// ========================================
// the shared sort control used by every sortable list.
// ========================================
import type {
  HUGGIES_TOKEN_SORT,
} from "../ts/token_sort";
import {
  HUGGIES_TOKEN_SORTS,
} from "../ts/token_sort";
// ========================================
// render the sort options as a row of buttons.
export function huggies_sort_control_fun(props: {
  sort: HUGGIES_TOKEN_SORT;
  on_sort: (sort: HUGGIES_TOKEN_SORT) => void;
  class?: string;
}): preact.JSX.Element {
  return (
    <div class={`huggies-sort-control ${props.class ?? ""}`.trim()}>
      {HUGGIES_TOKEN_SORTS.map((option) => (
        <button
          type="button"
          class={
            option.key === props.sort ? "huggies-sort-button is-active" : "huggies-sort-button"
          }
          aria-pressed={option.key === props.sort}
          onClick={() => props.on_sort(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
