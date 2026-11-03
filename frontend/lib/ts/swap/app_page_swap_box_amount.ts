// ========================================
// what each of the swap form's two amount boxes SHOWS.
//
// the page has two boxes and two kinds of number: the number the
// READER typed, and the number the ROUTER answered. a box shows the
// reader's number when they typed on that side, and the router's
// answer when they typed on the other side.
//
// --- WHY IT LIVES HERE: the two boxes and the two kinds of number are
// one rule, and the rule is needed in the form and in the store's
// switch direction. writing it once keeps the box that shows the
// answer and the amount that carries over saying the same thing.
//
// --- WHY --- the answer is the WHOLE amount and not a difference: the
// router answers with the full amount, so the box shows the full
// amount. subtracting the reader's own number from it would be
// arithmetic the router already did.
import type { SHIT_1170_SWAP_AMOUNT_SIDE } from "./app_page_swap_amount_side";
// ========================================
// --- TYPES ------------------------------
// what one box shows.
export interface SHIT_1170_SWAP_BOX_AMOUNT {
  // the human amount the box shows.
  human: string;
  // the same amount in the token's smallest unit, or null when the box
  // is empty.
  unit: string | null;
}
// ========================================
// --- PUBLIC ---------------------------
// what the box on the given side shows.
//
// --- WHY --- THE READER'S NUMBER WINS ON THEIR OWN SIDE: they typed
// it, and the router is answering for it. showing the router's number
// in a box the reader is typing in would move their number under
// their cursor.
//
// --- WHY --- THE READER'S OWN NUMBER STILL GETS A UNIT FIGURE: the
// line under the box shows the amount the chain sees, and the reader's
// own amount has one too. so the caller passes the unit amount of the
// number it read, and it is used whether the number came from the
// reader or from the router.
export function swap_box_amount_fun(
  side: SHIT_1170_SWAP_AMOUNT_SIDE,
  fixed_side: SHIT_1170_SWAP_AMOUNT_SIDE,
  fixed_human: string,
  fixed_unit: string | null,
  answered_unit: string | null,
  answered_decimals: number,
  unit_to_human: (unit: string, decimals: number) => string,
): SHIT_1170_SWAP_BOX_AMOUNT {
  if (side === fixed_side) {
    return { human: fixed_human, unit: fixed_unit };
  }
  if (answered_unit === null) {
    return { human: "", unit: null };
  }
  return {
    human: unit_to_human(answered_unit, answered_decimals),
    unit: answered_unit,
  };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
