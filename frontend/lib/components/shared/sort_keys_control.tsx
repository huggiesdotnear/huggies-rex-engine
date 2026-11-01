// ========================================
// the shared sort control: a row of small toggle buttons.
//
// it is used by more than one page — the discover page's token list and
// the two dex pool pages (rhea and intear-dex) — so it lives in shared/.
//
// --- WHY --- THE KEYS COME IN AS A PROP: a token list sorts by volume
// and market cap, and a dex pool list sorts by tvl, volume and apy. the
// keys are different AND their types are different, so the control takes
// them as a prop and the page that uses it says which keys it offers.
//
// this component does NOT fetch. it renders what it is given.
import { ArrowDown, ArrowUp } from "lucide-preact";
// ========================================
// ========================================
// --- PROPS ------------------------------
export interface HUGGIES_SORT_OPTION<KEY extends string> {
  key: KEY;
  label: string;
}
// ========================================
// ========================================
// --- PROPS ------------------------------
export interface HUGGIES_SORT_CONTROL_PROPS<KEY extends string> {
  // the sort keys, in the order they are offered.
  options: ReadonlyArray<HUGGIES_SORT_OPTION<KEY>>;
  // the chosen sort key.
  sort: KEY;
  // the chosen direction.
  direction: "asc" | "desc";
  // called when the reader picks another key.
  on_sort: (sort: KEY) => void;
  // called when the reader flips the direction.
  on_direction: (direction: "asc" | "desc") => void;
  // an extra class on the control, so a page can place it.
  class?: string;
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function huggies_sort_keys_control_fun<KEY extends string>(
  props: HUGGIES_SORT_CONTROL_PROPS<KEY>,
): preact.JSX.Element {
  const Icon = props.direction === "desc" ? ArrowDown : ArrowUp;
  return (
    <div class={`sort-control ${props.class ?? ""}`.trim()}>
      {props.options.map((option) => (
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
