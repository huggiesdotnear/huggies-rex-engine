// ========================================
// the feed's OWN scroll hook: ask for the next page when the reader
// nears the bottom of the PAGE.
//
// --- WHY THE FEED HAS ITS OWN AND NOT THE SHARED ONE: the shared hook
// (lib/ts/shared/use_scroll_load.ts) listens on a SCROLL BOX — an
// element with a max-height and an overflow. the feed page is not a
// scroll box: it is the page body that scrolls, and `main` is a
// min-height: 100vh column. so the feed's scroll box is the WINDOW.
//
// --- WHY THE RULE IS THE SAME AS THE SHARED HOOK'S: the next page is
// asked for 600px before the bottom, because the request takes a moment
// and the rows are then already there when the reader gets to them.
//
// --- WHY IT ALSO ASKS WHEN THE POSTS DO NOT FILL THE PAGE: a feed of
// twenty posts on a tall screen has nothing to scroll, so no scroll
// event would ever fire and the next page would never be asked for.
// that happens when a filter narrows the posts.
import { useEffect as use_effect } from "preact/hooks";
// ========================================
// how close to the bottom of the page the reader has to scroll before
// the next page is asked for. a little early, so the next page is
// usually there by the time they reach the end.
const SHIT_1170_FEED_SCROLL_THRESHOLD_PX = 600;
// ========================================
// ========================================
// --- HOOK ------------------------------
// @param has_more whether there is another page to load.
// @param loading whether a load is running right now.
// @param load_more what to call for the next page.
// @param posts_count how many posts are on screen. it is what tells
// the hook that a new page landed, so it can look again.
export function use_feed_scroll_load_fun(
  has_more: boolean,
  loading: boolean,
  load_more: () => void,
  posts_count: number,
): void {
  use_effect(() => {
    if (!has_more || loading) return;
    if (typeof window === "undefined") return;

    // --- WHY --- THE DISTANCE IS THE WINDOW'S: the page body scrolls,
    // not a box inside it. the scrollHeight is the whole page and the
    // scrollTop is how far down the reader is.
    const maybe_load_more_fun = (): void => {
      const distance =
        document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight;
      if (distance > SHIT_1170_FEED_SCROLL_THRESHOLD_PX) return;
      load_more();
    };

    // --- WHY --- THE PAGE IS CHECKED AS WELL AS THE SCROLL: a feed
    // SHORTER than the screen has no scrollbar, so no scroll event ever
    // fires and the next page is never asked for. that happens when a
    // filter narrows the posts, or when the first page is small. so the
    // hook also looks at the page on every change and asks for the next
    // page when the posts do not fill it.
    const page_height = document.documentElement.scrollHeight;
    const screen_height = window.innerHeight;
    if (page_height <= screen_height) {
      maybe_load_more_fun();
      return;
    }

    window.addEventListener("scroll", maybe_load_more_fun, { passive: true });
    return () => {
      window.removeEventListener("scroll", maybe_load_more_fun);
    };
  }, [has_more, loading, posts_count]);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
