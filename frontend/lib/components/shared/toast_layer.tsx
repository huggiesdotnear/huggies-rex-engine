// ========================================
// the toast layer: the messages that float over a page.
//
// a toast says "that worked" or "that did not", and links to the
// transaction when there is one.
//
// --- WHY IT IS ITS OWN COMPONENT AND NOT PART OF A PAGE'S MARKUP: the
// toast floats OVER the page, so it cannot live inside the page's
// 500px column — it is a fixed layer of its own, and it reads a store
// that any part of the page can write to.
//
// --- WHY IT IS SHARED AND NOT THE SWAP PAGE'S: the swap, the feed and
// the queue page all report a transaction, and all three say the same
// thing about it. so the layer lives in shared/ and every page that has
// something to report mounts its own layer element over the one store.
//
// mounts into <div id="SHIT_1170_COMPONENT_TOAST_LAYER">.
import { render } from "preact";
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_TOAST_STORE } from "../../ts/shared/toast_store";
import type { SHIT_1170_TOAST } from "../../ts/shared/toast_store";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function SHIT_1170_COMPONENT_TOAST_LAYER_FUN() {
  // --- WHY --- a revision counter forces a re-render on every store
  // notify; preact does not re-render from external state changes
  // alone.
  const [, set_revision] = use_state(0);

  use_effect(() => {
    const unsubscribe = SHIT_1170_TOAST_STORE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const toasts = SHIT_1170_TOAST_STORE.get();

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
              href={SHIT_1170_TOAST_STORE.tx_link(toast.tx_hash)}
            >
              VIEW TX
            </a>
          )}
          <button
            type="button"
            class="toast-close"
            onClick={() => SHIT_1170_TOAST_STORE.dismiss(toast.id)}
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
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_TOAST_LAYER;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_TOAST_LAYER_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
