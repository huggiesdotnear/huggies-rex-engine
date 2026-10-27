// ========================================
// the token page's load: it fills the page's store so the three
// components below can read it.
//
// the load lives in this one place. the components read the loaded
// data from the store and fetch nothing themselves.
//
// the page's html declares the three mount divs. they are in the html,
// not in this component, because each component self-mounts on import
// and so the div has to be in the document before the module runs.
// ========================================
import { render } from "preact";
import { useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKENS_PAGE_TOKEN } from "../ts/tokens_page_token";
import { HUGGIES_TOKENS_PAGE_TOKEN_STATE } from "../ts/tokens_page_token_state";
import { HUGGIES_TOKENS_PAGE_TOKEN_ID } from "../ts/tokens_page_token_id";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_TOKEN_PAGE_FUN() {
  // the one load. the metadata and the first holder page are asked for
  // at the same time, so the page is as slow as its slowest request
  // rather than the sum of the two.
  //
  // --- WHY --- the metadata and the holders are asked for together: the
  // holders table prices each balance with the token's price and
  // scales it by the token's decimals, and both come from the metadata
  // response. but the holders request does not need them — it returns
  // raw balances — so there is nothing to wait for.
  use_effect(() => {
    const token_id = HUGGIES_TOKENS_PAGE_TOKEN_ID.get();
    HUGGIES_TOKENS_PAGE_TOKEN_STATE.reset();
    if (token_id === null) return;
    let cancelled = false;
    void Promise.all([
      HUGGIES_TOKENS_PAGE_TOKEN.load_detail(token_id),
      HUGGIES_TOKENS_PAGE_TOKEN.load_holders(token_id, null),
    ])
      .then(([detail, holder_page]) => {
        if (cancelled) return;
        HUGGIES_TOKENS_PAGE_TOKEN_STATE.set({
          detail,
          holders: holder_page.rows,
          holder_total: holder_page.total,
          next_cursor: holder_page.next_cursor,
          loading_more: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        HUGGIES_TOKENS_PAGE_TOKEN_STATE.set({
          detail: null,
          holders: [],
          holder_total: 0,
          next_cursor: null,
          loading_more: false,
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
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TOKEN_PAGE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_TOKEN_PAGE_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
