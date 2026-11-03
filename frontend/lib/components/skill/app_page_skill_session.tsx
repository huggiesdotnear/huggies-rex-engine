// ========================================
// the skill page's SESSION MANAGEMENT card: the accounts the browser is
// signed in with, and the one session key the backend issued for them.
//
// the card shows two things:
//   1. the accounts the browser holds a signed message for
//   2. the session key — one per user, the same on every device
//
// the card does NOT fetch: it reads the page's store, and the page's
// start script loads it. that is the page pattern.
//
// --- WHY --- the key is shown in full and not masked: the reader is the
// user, and they need to copy the key to use it. hiding it would make
// the card useless.
//
// --- WHY --- there is a COPY button: a 64-character hex key cannot be
// picked out of a line of text by hand, and typing it is how it gets
// wrong.
// ========================================
import { render } from "preact";
import { useState as use_state } from "preact/hooks";
import { Copy, Check } from "lucide-preact";
import { HUGGIES_MOUNT_ID } from "../../ts/shared/mount_ids";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { HUGGIES_APP_PAGE_SKILL_SESSION_STORE } from "../../ts/skill/app_page_skill_session_store";
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_APP_PAGE_SKILL_SESSION_FUN() {
  const page_data = use_page_store_fun(HUGGIES_APP_PAGE_SKILL_SESSION_STORE);
  // whether the key was just copied, so the button can say so.
  const [copied, set_copied] = use_state(false);

  if (page_data === null) return null;

  const copy_key_fun = async () => {
    if (page_data.session_key === null) return;
    try {
      await navigator.clipboard.writeText(page_data.session_key);
      set_copied(true);
      // the tick goes away on its own, so the card does not need a timer
      // to clean it up.
      setTimeout(() => set_copied(false), 2000);
    } catch (err) {
      console.warn("[skill] the session key could not be copied", err);
    }
  };

  return (
    <section>
      <h2>SESSION MANAGEMENT</h2>
      <div>
        <div>
          <h3>SIGNED IN ACCOUNTS</h3>
          {page_data.accounts.length === 0 ? (
            <p>NO ACCOUNTS SIGNED IN</p>
          ) : (
            <ul>
              {page_data.accounts.map((account_id) => (
                <li key={account_id}>{account_id}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3>SESSION API KEY</h3>
          {page_data.loading ? (
            <p>ASKING THE BACKEND…</p>
          ) : page_data.session_key === null ? (
            <p>
              {page_data.error ??
                "NO SESSION KEY — SIGN IN WITH AN ACCOUNT TO GET ONE"}
            </p>
          ) : (
            <>
              <code>{page_data.session_key}</code>
              <button
                type="button"
                onClick={() => {
                  void copy_key_fun();
                }}
                title="copy the session key"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "COPIED" : "COPY KEY"}
              </button>
              <p>
                ONE KEY PER USER. THIS IS THE SAME KEY ON EVERY DEVICE THE USER
                SIGNS IN FROM.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_APP_PAGE_SKILL_SESSION;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_APP_PAGE_SKILL_SESSION_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
