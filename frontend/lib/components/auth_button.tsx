// ========================================
// sign-in / sign-out control. shows "LOGIN" when signed out and
// the full account id when signed in. all auth state lives in
// frontend/lib/ts/auth_status.ts — this file is a view.
// ========================================
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_AUTH } from "../ts/auth_status";
// ========================================
// ========================================
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_AUTH_BUTTON_FUN() {
  // ========================================
  // --- WHY --- a revision counter forces a re-render on every
  // auth_status notify; preact doesn't re-render from external
  // state changes alone.
  const [, set_revision] = use_state(0);
  // disabled while the wallet popup is open so a second click
  // can't open a second popup.
  const [busy, set_busy] = use_state(false);

  // subscribe to auth changes; return the unsubscribe so the
  // effect cleans up on unmount.
  use_effect(() => {
    const unsubscribe = HUGGIES_AUTH.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const account_id = HUGGIES_AUTH.get_account_id();
  const error = HUGGIES_AUTH.get_error();
  const is_signed_in = HUGGIES_AUTH.is_signed_in();

  const on_click_fun = () => {
    if (busy) return;
    if (is_signed_in) {
      set_busy(true);
      void HUGGIES_AUTH.sign_out().finally(() => set_busy(false));
      return;
    }
    set_busy(true);
    void HUGGIES_AUTH.sign_in().finally(() => set_busy(false));
  };

  const label = busy ? "..." : is_signed_in ? (account_id ?? "") : "LOGIN";

  return (
    <>
      {/* surface rather than swallow — a rejected wallet popup is a normal outcome */}
      <button
        type="button"
        onClick={on_click_fun}
        disabled={busy}
        title={
          is_signed_in
            ? `signed in as ${account_id} — click to sign out`
            : "sign in with NEAR"
        }
      >
        {label}
      </button>
      {error !== null && <p data-huggies-auth-error={error}>{error}</p>}
    </>
  );
}
// ========================================
// ========================================
// ========================================
// ========================================
// --- MOUNT ------------------------------
// --- WHY --- init() runs BEFORE the first render / connect so
// the wallet's autoConnect can't emit a sign-in we have no
// listener for.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_AUTH_BUTTON;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    HUGGIES_AUTH.init();
    render(<HUGGIES_COMPONENT_AUTH_BUTTON_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
