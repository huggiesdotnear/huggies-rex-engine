// ========================================
// the toast layer: the messages that float over the swap page.
//
// a toast says "that worked" or "that did not", and links to the
// transaction when there is one.
//
// --- WHY IT IS ITS OWN COMPONENT AND NOT PART OF THE SWAP FORM: the
// toast floats OVER the page, so it cannot live inside the page's 500px
// column — it is a fixed layer of its own, and it reads a store that
// any part of the page can write to.
//
// --- WHY IT IS THE SWAP PAGE'S AND NOT THE APP'S: the swap is the
// app's first transaction, so it is the only page that has something
// to report. a toast layer on a page that never writes to it is a
// layer of nothing.
//
// mounts into <div id="HUGGIES_COMPONENT_SWAP_TOASTS">.
import { render } from "preact";
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/shared/mount_ids";
import { HUGGIES_TOAST_STORE } from "../ts/swap/app_page_swap_toast_store";
import type { HUGGIES_TOAST } from "../ts/swap/app_page_swap_toast_store";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_SWAP_TOASTS_FUN() {
  // --- WHY --- a revision counter forces a re-render on every store
  // notify; preact does not re-render from external state changes
  // alone.
  const [, set_revision] = use_state(0);

  use_effect(() => {
    const unsubscribe = HUGGIES_TOAST_STORE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const toasts = HUGGIES_TOAST_STORE.get();

  if (toasts.length === 0) return <></>;

  return (
    <div class="toast-layer">
      {toasts.map((toast) => (
        <div class={`toast is-${toast.kind}`} key={toast.id}>
          <div class="toast-copy">
            <strong>{toast.title}</strong>
            {toast.detail !== null && <span>{toast.detail}</span>}
          </div>
          {toast.tx_hash !== null && (
            <a
              class="toast-link"
              href={HUGGIES_TOAST_STORE.tx_link(toast.tx_hash)}
            >
              VIEW TX
            </a>
          )}
          <button
            type="button"
            class="toast-close"
            onClick={() => HUGGIES_TOAST_STORE.dismiss(toast.id)}
            title="dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_SWAP_TOASTS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_SWAP_TOASTS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
