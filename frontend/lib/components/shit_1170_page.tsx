// ========================================
// the $SHIT page's load: it fills the page's store so the four
// components below can read it.
//
// the load lives in this one place. the components read the loaded data
// from the store and fetch nothing themselves.
//
// the page's html declares the mount divs. they are in the html, not in
// this component, because each component self-mounts on import and so
// the div has to be in the document before the module runs.
import { render } from "preact";
import { useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKENS_PAGE_SHIT_1170 } from "../ts/tokens_page_shit_1170";
import { HUGGIES_TOKENS_PAGE_SHIT_1170_STATE } from "../ts/tokens_page_shit_1170_state";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_SHIT_1170_PAGE_FUN() {
  // the one load. it renders nothing.
  //
  // --- WHY --- the three steps run in order, not together: the summary
  // carries the decimals and the total supply, and the holder rows need
  // both. the holder rows also need the price, because a row priced with
  // a price of zero reads as "$0.00" — a lie rather than a missing
  // number.
  use_effect(() => {
    HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.reset();
    let cancelled = false;
    void HUGGIES_TOKENS_PAGE_SHIT_1170.load_summary()
      .then(async (summary) => {
        if (cancelled) return;
        const price = await HUGGIES_TOKENS_PAGE_SHIT_1170.load_price();
        if (cancelled) return;
        const price_usd =
          price.price_usd > 0 ? price.price_usd : (summary?.price_usd ?? 0);
        const total_supply_raw = HUGGIES_TOKENS_PAGE_SHIT_1170.bigint_or_zero(
          summary?.total_supply_raw ?? "0",
        );
        const page = await HUGGIES_TOKENS_PAGE_SHIT_1170.load_holders(
          null,
          price_usd,
          summary?.decimals ?? 18,
          total_supply_raw,
        );
        if (cancelled) return;
        HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.set({
          ...HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.get(),
          summary,
          price,
          holders: page.rows,
          holder_total: page.total,
          next_cursor: page.next_cursor,
          loading_more: false,
          loading: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.set({
          ...HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.get(),
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <></>;
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
//
// --- WHY --- this mounts into its own div in the page's html, so the
// load starts as soon as the page is parsed.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_SHIT_1170_PAGE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_SHIT_1170_PAGE_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
