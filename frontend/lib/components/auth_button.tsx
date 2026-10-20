// ========================================
// AUTH BUTTON
// the sign-in / sign-out control. shows "LOGIN" while signed out and
// the connected account id (shortened) once signed in, and starts a
// NEP-413 signed-message handshake on click.
//
// ALL auth state lives in frontend/lib/ts/auth_status.ts. this file
// is only a view: it reads from HUGGIES_AUTH and re-renders when that
// module says something changed. keeping the wallet handshake out of
// here means the account page (or any gated feature) can subscribe to
// the same state without duplicating it.
//
// signing in is a one-shot connect+sign: a single wallet popup that
// both connects the wallet and produces the signed message. the
// signature, and the message/nonce/recipient it depends on, are stored
// by auth_status.ts for later server-side verification.
//
// the account id is truncated for display only — the full id is what
// gets stored and verified. ellipsis placement keeps the start and
// end visible because NEAR ids are often name.near and the suffix is
// the part people recognise.
// ========================================
import { render } from "preact";
// preact exports this hook as `useState`/`useEffect`; they are aliased
// on import so the call sites below follow this repo's snake_case rule
// without renaming the upstream exports.
import {
  useState as use_state,
  useEffect as use_effect,
} from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_AUTH } from "../ts/auth_status";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// shorten_account_fun — "sleet.near" becomes "sle…ear" so the button
// stays inside the 500px page column. naive character slicing, which
// is fine for an id that is always ASCII.
function shorten_account_fun(account_id: string): string {
  const KEEP_HEAD = 3;
  const KEEP_TAIL = 3;
  if (account_id.length <= KEEP_HEAD + KEEP_TAIL + 1) return account_id;
  return `${account_id.slice(0, KEEP_HEAD)}...${account_id.slice(-KEEP_TAIL)}`;
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_AUTH_BUTTON_FUN() {
  // ========================================
  // a single counter forces a re-render whenever auth_status notifies.
  // reading the real values through the getters on every render keeps
  // this component a pure view of the module's state.
  const [, set_revision] = use_state(0);

  // subscribe to auth changes and clean up on unmount, so a
  // remounted component does not stack listeners.
  use_effect(() => {
    const unsubscribe = HUGGIES_AUTH.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const account_id = HUGGIES_AUTH.get_account_id();
  const busy = HUGGIES_AUTH.get_busy();
  const error = HUGGIES_AUTH.get_error();
  const is_signed_in = HUGGIES_AUTH.is_signed_in();

  const on_click_fun = () => {
    if (is_signed_in) {
      void HUGGIES_AUTH.sign_out();
      return;
    }
    void HUGGIES_AUTH.sign_in();
  };

  // while the wallet popup is open the button is disabled, so a second
  // click cannot open a second popup.
  const label = busy ? "..." : is_signed_in ? shorten_account_fun(account_id ?? "") : "LOGIN";

  return (
    <>
      {/* disabled while busy so the popup cannot be opened twice */}
      <button
        type="button"
        onClick={on_click_fun}
        disabled={busy}
        title={is_signed_in ? `signed in as ${account_id} — click to sign out` : "sign in with NEAR"}
      >
        {label}
      </button>
      {/* surfaced rather than swallowed — a rejected wallet popup is */}
      {/* a normal outcome and the user should see why nothing happened */}
      {error !== null && <p data-huggies-auth-error={error}>{error}</p>}
    </>
  );
}
// ========================================
// ========================================
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount so the component file works as its own entry. looks for
// a <div id="HUGGIES_COMPONENT_AUTH_BUTTON"> on the page and renders
// into it.
//
// the side effect is guarded by an id check so importing this module
// from another file won't accidentally mount a second instance.
//
// init() runs BEFORE the first render and before any connect(), so the
// wallet's autoConnect cannot emit a sign-in we have no listener for.
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