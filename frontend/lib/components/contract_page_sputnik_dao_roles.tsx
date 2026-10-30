// ========================================
// the DAO's members: one card per account, with the roles that account
// is in and the permissions those roles grant.
//
// --- WHY --- one card per account and not one tab per role: an account
// can be in several roles, and a list that repeats the account for each of
// them makes the reader count the duplicates by hand. the roles the
// account is in become a row inside its card instead.//
// --- WHY --- the roles that are open to everyone are not cards. the
// contract answers `"kind": "Everyone"` for them, with no member list
// at all, so there is nothing to put in one. they are a note under the
// cards.
//
// --- WHY --- the permissions sit behind a toggle: a real member holds
// fifteen or more of them (`policy_update_parameters`,
// `factory_info_update`, `upgrade_self` and the rest), and listing
// them all turned every card into a wall of small grey words. the roles
// say what the member IS, so they lead; the permissions are the detail
// the reader asks for.
//
// it reads the loaded dao from the page's store. it fetches nothing.
// ========================================
import { render } from "preact";
import { useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_DAO_PAGE_STATE } from "../ts/contract_page_sputnik_dao_state";
import { use_page_store_fun } from "../ts/use_page_store";
import { current_app_depth_fun } from "../ts/app_depth";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the actions a set of permissions allows.
//
// --- WHY --- the raw permissions are a wall of text: `call:VoteRemove`,
// `transfer:VoteRemove`, `policy_update_parameters:*` and a dozen
// more. the part before the colon is what is acted on — the action —
// and the part after is the scope. so the card lists the actions, and
// the full list with every scope is in the card's title.
function permission_actions_fun(permissions: ReadonlyArray<string>): string[] {
  const actions = new Set<string>();
  for (const permission of permissions) {
    const colon = permission.indexOf(":");
    const action = colon === -1 ? permission : permission.slice(0, colon);
    actions.add(action);
  }
  return [...actions];
}
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_ROLES_FUN() {
  const page_state = use_page_store_fun(HUGGIES_DAO_PAGE_STATE);

  // the members whose permissions the reader has opened.
  const [open_ids, set_open_ids] = use_state<string[]>([]);

  const state = page_state;
  const dao = state.dao;
  if (dao === null) return null;

  const depth = current_app_depth_fun();

  if (dao.members.length === 0) {
    return (
      <section>
        <h2>MEMBERS</h2>
        <p class="empty">NO MEMBERS NAMED IN THE POLICY</p>
      </section>
    );
  }

  const toggle_fun = (account_id: string) => {
    set_open_ids((current) =>
      current.includes(account_id)
        ? current.filter((open) => open !== account_id)
        : [...current, account_id],
    );
  };

  return (
    <section>
      <h2>MEMBERS ({dao.members.length})</h2>
      <div class="members-scroll">
        <div class="members">
          {dao.members.map((member) => {
            const is_open = open_ids.includes(member.account_id);
            const actions = permission_actions_fun(member.permissions);
            return (
              <div class="member" key={member.account_id}>
                <div class="member-head">
                  <a
                    class="member-account"
                    href={`${"../".repeat(depth)}account.html?id=${encodeURIComponent(member.account_id)}`}
                  >
                    {member.account_id}
                  </a>
                  <button
                    type="button"
                    class="member-toggle"
                    onClick={() => toggle_fun(member.account_id)}
                    aria-expanded={is_open}
                  >
                    {actions.length} ACTION{actions.length === 1 ? "" : "S"}
                    <span class="caret">{is_open ? "▲" : "▼"}</span>
                  </button>
                </div>
                <div class="member-roles">
                  {member.roles.map((role) => (
                    <span class="role-chip">{role}</span>
                  ))}
                </div>
                {is_open && (
                  <div
                    class="member-permissions"
                    title={member.permissions.join(", ")}
                  >
                    {actions.length === 0 ? (
                      <p class="note">NO PERMISSIONS</p>
                    ) : (
                      actions.map((action) => (
                        <span class="permission">{action}</span>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {dao.open_roles.length > 0 && (
        <div class="open-roles">
          <span class="open-roles-label">OPEN TO EVERYONE</span>
          <span class="open-roles-roles">
            {dao.open_roles.map((role) => (
              <span class="role-chip is-open" key={role.name}>
                {role.name}
              </span>
            ))}
          </span>
          <span class="open-roles-note">
            any account can act in{" "}
            {dao.open_roles.length === 1 ? "this role" : "these roles"}
          </span>
        </div>
      )}
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_ROLES;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_ROLES_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
