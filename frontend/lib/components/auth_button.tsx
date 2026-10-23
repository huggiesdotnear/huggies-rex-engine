// ========================================
// sign-in / account control. shows "LOGIN" when signed out and the
// active account id when signed in; clicking a signed-in button
// opens a dropdown listing every known account. all auth state
// lives in frontend/lib/ts/auth_status.ts — this file is a view.
// ========================================
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import {
  useState as use_state,
  useEffect as use_effect,
  useRef as use_ref,
} from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_AUTH } from "../ts/auth_status";
// ========================================
// ========================================
// ========================================
// ========================================
// --- HELPERS ----------------------------
// close the account id down for the button label — NEAR ids are
// long and the button must stay readable.
function shorten_account_id_fun(account_id: string): string {
  if (account_id.length <= 18) return account_id;
  const head = account_id.slice(0, 8);
  const tail = account_id.slice(-6);
  return `${head}…${tail}`;
}
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
  // whether the account dropdown is open.
  const [open, set_open] = use_state(false);
  // the dropdown's own root, used to detect clicks outside it.
  const root_ref = use_ref<HTMLDivElement | null>(null);

  // subscribe to auth changes; return the unsubscribe so the
  // effect cleans up on unmount.
  use_effect(() => {
    const unsubscribe = HUGGIES_AUTH.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  // close the dropdown when the user clicks anywhere else.
  // --- WHY --- the dropdown is a plain div with no portal, so a
  // document-level listener is the only way to catch a click on
  // the page behind it.
  use_effect(() => {
    if (!open) return;
    const on_document_click_fun = (event: MouseEvent) => {
      const root = root_ref.current;
      if (root === null) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      set_open(false);
    };
    document.addEventListener("mousedown", on_document_click_fun);
    return () => {
      document.removeEventListener("mousedown", on_document_click_fun);
    };
  }, [open]);

  const account_id = HUGGIES_AUTH.get_account_id();
  const error = HUGGIES_AUTH.get_error();
  const is_signed_in = HUGGIES_AUTH.is_signed_in();
  const accounts = HUGGIES_AUTH.list_accounts();

  const on_click_fun = () => {
    if (busy) return;
    if (is_signed_in) {
      set_open((was_open) => !was_open);
      return;
    }
    set_busy(true);
    void HUGGIES_AUTH.sign_in().finally(() => set_busy(false));
  };

  const on_pick_account_fun = (next_account_id: string) => {
    if (busy) return;
    set_open(false);
    if (next_account_id === account_id) return;
    set_busy(true);
    void HUGGIES_AUTH.switch_account(next_account_id).finally(() =>
      set_busy(false),
    );
  };

  const on_remove_account_fun = (target_account_id: string) => {
    if (busy) return;
    set_open(false);
    HUGGIES_AUTH.remove_account(target_account_id);
  };

  const on_add_account_fun = () => {
    if (busy) return;
    set_open(false);
    set_busy(true);
    void HUGGIES_AUTH.sign_in().finally(() => set_busy(false));
  };

  const on_sign_out_fun = () => {
    if (busy) return;
    set_open(false);
    set_busy(true);
    void HUGGIES_AUTH.sign_out().finally(() => set_busy(false));
  };

  const label = busy
    ? "..."
    : is_signed_in
      ? shorten_account_id_fun(account_id ?? "")
      : "LOGIN";

  return (
    <div ref={root_ref} data-huggies-auth-root={is_signed_in ? "1" : "0"}>
      <button
        type="button"
        onClick={on_click_fun}
        disabled={busy}
        title={
          is_signed_in
            ? `signed in as ${account_id} — click for the account menu`
            : "sign in with NEAR"
        }
      >
        {label}
      </button>
      {open && is_signed_in && (
        <div data-huggies-auth-menu="1">
          <p data-huggies-auth-menu-label="1">ACCOUNTS</p>
          {accounts.map((id) => (
            <div key={id} data-huggies-auth-account={id}>
              <button
                type="button"
                class={
                  id === account_id
                    ? "huggies-auth-account-active"
                    : "huggies-auth-account"
                }
                onClick={() => on_pick_account_fun(id)}
                disabled={busy}
                title={
                  HUGGIES_AUTH.has_session(id)
                    ? `switch to ${id}`
                    : `switch to ${id} — the wallet will ask you to sign a message`
                }
              >
                {id === account_id ? "● " : "○ "}
                {id}
              </button>
              <button
                type="button"
                class="huggies-auth-account-remove"
                onClick={() => on_remove_account_fun(id)}
                disabled={busy}
                title={`remove ${id}`}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={on_add_account_fun}
            disabled={busy}
            title="connect another account"
          >
            ADD ACCOUNT
          </button>
          <button
            type="button"
            onClick={on_sign_out_fun}
            disabled={busy}
            title="sign out of every account"
          >
            SIGN OUT
          </button>
        </div>
      )}
      {error !== null && <p data-huggies-auth-error={error}>{error}</p>}
    </div>
  );
}
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
