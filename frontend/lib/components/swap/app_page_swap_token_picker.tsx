// ========================================
// the token picker: the popup that opens when the reader taps a token
// card, and hands the chosen token back.
//
// it is the discover page's token list, in a popup: the SAME shared list
// (components/shared/token_list.tsx), the same rows, the same icons. the
// search hits the api's /tokens/search, so a token outside the loaded
// page is still findable.
//
// --- WHY IT IS A SEPARATE COMPONENT: the swap form has two token
// cards and both of them open the same picker. one component serves
// both, and it says which side it is picking for.
//
// --- WHY IT IS THE SHARED LIST AND NOT A COPY OF IT: the picker used
// to have its own rows, its own css class names and its own idea of
// what a token row carries. so a token looked one way on the discover
// page and another way in the picker, and a change to the list had to
// be made twice. the shared list draws the rows, and the picker only
// owns the popup around it.
//
// mounts into <div id="HUGGIES_COMPONENT_SWAP_TOKEN_PICKER">.
import { render } from "preact";
import {
  useEffect as use_effect,
  useMemo as use_memo,
  useRef as use_ref,
} from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../../ts/shared/mount_ids";
import { HUGGIES_SWAP_TOKEN_PICKER } from "../../ts/swap/app_page_swap_token_picker";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { huggies_token_list_fun } from "../shared/token_list";
import {
  HUGGIES_DEFAULT_TOKEN_SORT,
  HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION,
} from "../../ts/discover/app_page_discover_token_sort_options";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_SWAP_TOKEN_PICKER_FUN() {
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
        {huggies_token_list_fun({
          tokens: tokens,
          on_search: (query) => {
            void HUGGIES_SWAP_TOKEN_PICKER.search(query);
          },
          on_clear: () => {
            HUGGIES_SWAP_TOKEN_PICKER.clear_search();
          },
          loading: picker.loading,
          searching: picker.loading,
          sort: HUGGIES_DEFAULT_TOKEN_SORT,
          direction: HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION,
          on_sort: () => {},
          on_direction: () => {},
          has_more: false,
          on_load_more: () => {},
          on_pick: (token_id) => {
            HUGGIES_SWAP_TOKEN_PICKER.pick(token_id);
          },
          empty_text: "NO TOKENS FOUND",
          searching_text: "SEARCHING...",
          loading_text: "LOADING TOKENS...",
          hide_sort: true,
        })}
      </div>
    </div>
  );
}
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
