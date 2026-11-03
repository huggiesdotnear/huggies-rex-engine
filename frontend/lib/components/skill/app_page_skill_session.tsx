// ========================================
// the skill page's SESSION MANAGEMENT card: the accounts the browser is
// signed in with, and the session key each one has.
//
// the card shows ONE CARD PER ACCOUNT. every account has its own key,
// because a key has to be narrowable to one wallet.
//
// the card does NOT fetch: it reads the page's store, and the page's
// start script loads it. that is the page pattern.
//
// --- WHY --- the key is shown in full and not masked: the reader is the
// user, and they need to copy the key. hiding it would make the card
// useless.
//
// --- WHY --- there is a COPY button: a 64-character hex key cannot be
// picked out of a line of text by hand, and typing it is how it gets
// wrong.
//
// --- WHY --- there is a COPY ALL button: a reader with several accounts
// would otherwise have to copy each key one at a time, and the whole
// point of one key per account was to keep the model clean — not to
// make the reader do ten copy-pastes.
//
// --- WHY --- there is a ROTATE button: a key that has been seen by
// somebody else should be replaceable. the rotation sends the account's
// signed message, so it proves the ownership — see the rotate loader.
import { render } from "preact";
import { useState as use_state } from "preact/hooks";
import { Copy, Check, RefreshCw } from "lucide-preact";
import { HUGGIES_MOUNT_ID } from "../../ts/shared/mount_ids";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { HUGGIES_APP_PAGE_SKILL_SESSION_STORE } from "../../ts/skill/app_page_skill_session_store";
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_APP_PAGE_SKILL_SESSION_FUN() {
  const page_data = use_page_store_fun(HUGGIES_APP_PAGE_SKILL_SESSION_STORE);
  // whether the key was just copied, so the button can say so.
  const [copied, set_copied] = use_state("");

  if (page_data === null) return null;

  const copy_fun = async (account_id: string, session_key: string) => {
    try {
      await navigator.clipboard.writeText(session_key);
      set_copied(account_id);
      // the tick goes away on its own, so the card does not need a
      // timer to clean it up.
      setTimeout(() => set_copied(""), 2000);
    } catch (err) {
      console.warn("[skill] the session key could not be copied", err);
    }
  };

  const copy_all_fun = async () => {
    const keys = page_data.accounts
      .map((account) =>
        account.session_key === null
          ? null
          : `${account.account_id} ${account.session_key}`,
      )
      .filter((line): line is string => line !== null);
    if (keys.length === 0) return;
    try {
      await navigator.clipboard.writeText(keys.join("\n"));
      set_copied("__all__");
      setTimeout(() => set_copied(""), 2000);
    } catch (err) {
      console.warn("[skill] the session keys could not be copied", err);
    }
  };

  const rotate_fun = (account_id: string) => {
    void HUGGIES_APP_PAGE_SKILL_SESSION_STORE.rotate(account_id);
  };

  return (
    <section>
      <h2>SESSION MANAGEMENT</h2>
      {page_data.accounts.length === 0 ? (
        <p>NO ACCOUNTS SIGNED IN</p>
      ) : (
        <>
          <div class="skill-session-accounts">
            {page_data.accounts.map((account) => (
              <div key={account.account_id} class="skill-session-account">
                <h3>
                  {account.is_active ? "● " : "○ "}
                  {account.account_id}
                </h3>
                {account.session_key === null ? (
                  <p>
                    {page_data.loading
                      ? "ASKING THE BACKEND…"
                      : "NO KEY FOR THIS ACCOUNT"}
                  </p>
                ) : (
                  <>
                    <code>{account.session_key}</code>
                    <div class="skill-session-buttons">
                      <button
                        type="button"
                        onClick={() => {
                          void copy_fun(
                            account.account_id,
                            account.session_key ?? "",
                          );
                        }}
                        title="copy the session key"
                        disabled={page_data.rotating}
                      >
                        {copied === account.account_id ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                        {copied === account.account_id ? "COPIED" : "COPY KEY"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          rotate_fun(account.account_id);
                        }}
                        title="replace this key with a new one"
                        disabled={page_data.rotating}
                      >
                        <RefreshCw size={16} />
                        {page_data.rotating ? "ROTATING…" : "ROTATE"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            class="skill-session-copy-all"
            onClick={() => {
              void copy_all_fun();
            }}
            title="copy every account's key"
            disabled={page_data.rotating}
          >
            {copied === "__all__" ? <Check size={16} /> : <Copy size={16} />}
            {copied === "__all__" ? "COPIED ALL" : "COPY ALL KEYS"}
          </button>
          <p class="skill-session-note">
            ONE KEY PER ACCOUNT. THE SAME KEY ON EVERY DEVICE THAT ACCOUNT SIGNS
            IN FROM.
          </p>
        </>
      )}
      {page_data.error !== null && (
        <p class="skill-session-error">{page_data.error}</p>
      )}
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
