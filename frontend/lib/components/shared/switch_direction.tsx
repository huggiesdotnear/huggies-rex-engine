// ========================================
// the switch direction control: a thin horizontal bar between the two
// sides of a swap, with an arrow at each end.
//
// the bar is the control, not a decoration around a button: the whole
// line is the thing the reader clicks, and the two arrows at its ends say
// what it does — the up arrow takes the token out and sends it in, the
// down arrow does the reverse. so the left end carries the up arrow and
// the right end the down arrow, and hovering flips both of them.
//
// --- WHY --- THE ARROWS FLIP ON HOVER: the click swaps the pair, so the
// arrows swapping places is the reader seeing the swap happen before it
// does. the rotation is a css transition, so it reads as one motion and
// not as two icons changing.
// ========================================
import { ArrowDown, ArrowUp } from "lucide-preact";
// ========================================
// --- COMPONENT --------------------------
// --- WHY --- the caller owns the action: only the caller knows what
// swapping means for its two sides, so the bar takes the click as a
// prop and does not reach for a store of its own.
export function huggies_switch_direction_fun(props: {
  // what the click does. the swap page swaps the two tokens.
  on_switch: () => void;
}): preact.JSX.Element {
  return (
    <button
      type="button"
      class="switch-direction"
      title="switch direction"
      aria-label="switch direction"
      onClick={() => props.on_switch()}
    >
      <span class="switch-direction-arrow is-up">
        <ArrowUp size={14} strokeWidth={2.5} />
      </span>
      <span class="switch-direction-line" />
      <span class="switch-direction-label">SWITCH DIRECTION</span>
      <span class="switch-direction-line" />
      <span class="switch-direction-arrow is-down">
        <ArrowDown size={14} strokeWidth={2.5} />
      </span>
    </button>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
