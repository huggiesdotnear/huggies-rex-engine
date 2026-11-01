// ========================================
// the token picker: the popup that opens when the reader taps a token
// card, and hands the chosen token back.
//
// it is the discover page's token list, in a popup: the same search
// box, the same rows, the same icons. the search hits the api's
// /tokens/search, so a token outside the loaded page is still findable.
//
// --- WHY IT IS A SEPARATE COMPONENT: the swap form has two token
// cards and both of them open the same picker. one component serves
// both, and it says which side it is picking for.
//
// mounts into <div id="HUGGIES_COMPONENT_SWAP_TOKEN_PICKER">.
import { render } from "preact";
import {
  useState as use_state,
  useEffect as use_effect,
  useMemo as use_memo,
  useRef as use_ref,
} from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/shared/mount_ids";
import { HUGGIES_SWAP_TOKEN_PICKER } from "../ts/swap/app_page_swap_token_picker";
import { use_page_store_fun } from "../ts/shared/use_page_store";
import type { HUGGIES_SWAP_PICKER_TOKEN } from "../ts/swap/app_page_swap_token_picker";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how long to wait after a keystroke before asking the api, so typing a
// word is one request and not one per letter.
const HUGGIES_PICKER_SEARCH_DEBOUNCE_MS = 250;
// ========================================
// ========================================
// --- ROW -------------------------------
function picker_row_fun(token: HUGGIES_SWAP_PICKER_TOKEN): preact.JSX.Element {
  return (
    <button
      type="button"
      class="picker-row"
      onClick={() => {
        HUGGIES_SWAP_TOKEN_PICKER.pick(token.id);
      }}
    >
      {token.icon !== null ? (
        <img class="picker-icon" src={token.icon} alt="" />
      ) : (
        <span class="picker-icon is-empty" />
      )}
      <span class="picker-copy">
        <strong>{token.symbol}</strong>
        <span>{token.name}</span>
      </span>
    </button>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_SWAP_TOKEN_PICKER_FUN() {
  const [query, set_query] = use_state("");
  // the picker's own root, so a click outside it can close it.
  const root_ref = use_ref<HTMLDivElement | null>(null);

  // --- WHY --- the picker reads the store and never fetches: the swap
  // page has one loader, and the picker is part of that page.
  //
  // --- WHY --- it subscribes and does not just read: the picker is
  // opened by the swap FORM, which is a different component. preact
  // only re-renders a component when its OWN state changes, so without
  // a subscription the picker would never learn that it was opened.
  const picker = use_page_store_fun(HUGGIES_SWAP_TOKEN_PICKER);
  const tokens = use_memo(() => picker.tokens, [picker.tokens]);

  // the search asks the api, debounced.
  use_effect(() => {
    const needle = query.trim();
    if (needle.length === 0) {
      HUGGIES_SWAP_TOKEN_PICKER.clear_search();
      return;
    }
    const timer = window.setTimeout(() => {
      HUGGIES_SWAP_TOKEN_PICKER.search(needle);
    }, HUGGIES_PICKER_SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  // close the picker when the reader clicks anywhere else.
  use_effect(() => {
    if (!picker.open) return;
    const on_document_click_fun = (event: MouseEvent) => {
      const root = root_ref.current;
      if (root === null) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      HUGGIES_SWAP_TOKEN_PICKER.close();
    };
    document.addEventListener("mousedown", on_document_click_fun);
    return () => {
      document.removeEventListener("mousedown", on_document_click_fun);
    };
  }, [picker.open]);

  // escape closes it too, so the keyboard can get out of it.
  use_effect(() => {
    if (!picker.open) return;
    const on_key_fun = (event: KeyboardEvent) => {
      if (event.key === "Escape") HUGGIES_SWAP_TOKEN_PICKER.close();
    };
    document.addEventListener("keydown", on_key_fun);
    return () => {
      document.removeEventListener("keydown", on_key_fun);
    };
  }, [picker.open]);

  if (!picker.open) return <></>;

  return (
    <div class="picker-backdrop">
      <div class="picker" ref={root_ref}>
        <div class="picker-head">
          <strong>{picker.label}</strong>
          <button
            type="button"
            class="picker-close"
            onClick={() => HUGGIES_SWAP_TOKEN_PICKER.close()}
            title="close"
          >
            ✕
          </button>
        </div>
        <div class="picker-search">
          <input
            type="search"
            value={query}
            placeholder="name or symbol"
            autoFocus
            onInput={(event) => {
              set_query((event.currentTarget as HTMLInputElement).value);
            }}
          />
        </div>
        <div class="picker-list">
          {tokens.length === 0 && !picker.loading ? (
            <p class="picker-empty">NO TOKENS FOUND</p>
          ) : (
            tokens.map((token) => picker_row_fun(token))
          )}
          {picker.loading && <p class="picker-loading">SEARCHING...</p>}
        </div>
      </div>
    </div>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_SWAP_TOKEN_PICKER;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_SWAP_TOKEN_PICKER_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
