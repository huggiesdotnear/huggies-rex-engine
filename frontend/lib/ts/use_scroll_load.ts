// ========================================
// the shared hook: load the next page when the reader nears the bottom
// of a scrollable list.
//
// --- WHY IT IS A HOOK AND NOT A COPY IN EACH COMPONENT: the discover
// page's token list, the token page's holders and the $SHIT page's
// holders are three lists that all work the same way — a scroll box, a
// next page, and a request when the reader gets near the end. the
// discover page had its own copy of that logic and the other two had
// a button instead, so the app had three different ways of asking for
// more. this hook is the one way.
//
// --- WHY THE NEXT PAGE IS ASKED FOR BEFORE THE READER REACHES THE
// END: the request takes a moment, so asking early means the rows are
// usually already there by the time the reader gets to them. asking
// at the very bottom means they wait for a spinner.
//
// --- WHY IT IS A HOOK AND NOT A LISTENER IN THE EFFECT: the hook owns
// the listener, the threshold and the "is there more" question, so a
// list only has to say WHAT to load and WHEN to stop.
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
// ========================================
// how close to the bottom of the list the reader has to scroll before
// the next page is asked for. a little early, so the next page is
// usually there by the time they reach the end.
const HUGGIES_SCROLL_LOAD_THRESHOLD_PX = 600;
// ========================================
// --- HOOK ------------------------------
// @param scroll_ref the scroll box the reader scrolls.
// @param has_more whether there is another page to load.
// @param loading whether a load is running right now.
// @param load_more what to call for the next page.
export function use_scroll_load_fun(
  scroll_ref: { current: HTMLElement | null },
  has_more: boolean,
  loading: boolean,
  load_more: () => void,
): void {
  // the rows that have come in. it is what tells the hook that a new
  // page landed, so it can look again.
  const [rows_count, set_rows_count] = use_state(0);
  use_effect(() => {
    const element = scroll_ref.current;
    if (element === null) return;
    set_rows_count(element.querySelectorAll("tr").length);
  }, [scroll_ref.current]);

  use_effect(() => {
    if (!has_more || loading) return;
    const element = scroll_ref.current;
    if (element === null) return;

    // --- WHY THE LIST IS CHECKED AS WELL AS THE SCROLL: a list that is
    // SHORTER than its box has no scrollbar, so no scroll event ever
    // fires and the next page is never asked for. that happens when a
    // filter narrows the rows, or when the first page is small. so the
    // hook also looks at the list on every change and asks for the next
    // page when the rows do not fill the box.
    const maybe_load_more_fun = (): void => {
      const distance =
        element.scrollHeight - element.scrollTop - element.clientHeight;
      if (distance > HUGGIES_SCROLL_LOAD_THRESHOLD_PX) return;
      load_more();
    };

    // the rows do not fill the box: there is nothing to scroll, so the
    // next page has to be asked for on the strength of the list alone.
    if (element.scrollHeight <= element.clientHeight) {
      maybe_load_more_fun();
      return;
    }

    element.addEventListener("scroll", maybe_load_more_fun);
    return () => {
      element.removeEventListener("scroll", maybe_load_more_fun);
    };
  }, [has_more, loading, rows_count]);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
