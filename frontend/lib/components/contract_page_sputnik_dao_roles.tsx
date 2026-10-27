// ========================================
// the DAO's members: one table, one row per account, with the roles
// that account is in and the permissions those roles grant.
//
// --- WHY --- one table and not one tab per role: an account can be in
// several roles, and a table that repeats the account for each of them
// makes the reader count the duplicates by hand. the roles the account
// is in become a column instead.
//
// --- WHY --- the roles that are open to everyone are not rows. the
// contract answers `"kind": "Everyone"` for them, with no member list
// at all, so there is nothing to put in a row. they are a note under
// the table.
//
// it reads the loaded dao from the page's store. it fetches nothing.
// ========================================
import { render } from "preact";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_DAO_PAGE_STATE } from "../ts/contract_page_sputnik_dao_state";
import { current_app_depth_fun } from "../ts/app_depth";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the actions a set of permissions allows.
//
// --- WHY --- the raw permissions are a wall of text: `call:VoteRemove`,
// `transfer:VoteRemove`, `policy_update_parameters:*` and a dozen
// more. the part before the colon is what is acted on — the action —
// and the part after is the scope. so the cell lists the actions, one
// per line, and the full list with every scope is in the cell's
// title.
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
  const [, set_revision] = use_state(0);

  use_effect(() => {
    const unsubscribe = HUGGIES_DAO_PAGE_STATE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const state = HUGGIES_DAO_PAGE_STATE.get();
  const dao = state.dao;
  if (dao === null) return null;

  const depth = current_app_depth_fun();

  if (dao.members.length === 0) {
    return (
      <section class="huggies-dao-roles-section">
        <h2>MEMBERS</h2>
        <p class="huggies-dao-empty">NO MEMBERS NAMED IN THE POLICY</p>
      </section>
    );
  }

  return (
    <section class="huggies-dao-roles-section">
      <h2>MEMBERS ({dao.members.length})</h2>
      <div class="huggies-dao-members-scroll">
        <table class="huggies-dao-members-table">
          <thead>
            <tr>
              <th class="huggies-dao-member-rank">#</th>
              <th class="huggies-dao-member-account">ACCOUNT</th>
              <th class="huggies-dao-member-roles">ROLES</th>
              <th class="huggies-dao-member-permissions">PERMISSIONS</th>
            </tr>
          </thead>
          <tbody>
            {dao.members.map((member, index) => (
              <tr key={member.account_id}>
                <td class="huggies-dao-member-rank">{index + 1}</td>
                <td class="huggies-dao-member-account">
                  <a
                    href={`${"../".repeat(depth)}account.html?id=${encodeURIComponent(member.account_id)}`}
                  >
                    {member.account_id}
                  </a>
                </td>
                <td class="huggies-dao-member-roles">
                  {member.roles.map((role) => (
                    <span class="huggies-dao-role-chip">{role}</span>
                  ))}
                </td>
                <td
                  class="huggies-dao-member-permissions"
                  title={member.permissions.join(", ")}
                >
                  {member.permissions.length === 0
                    ? "—"
                    : permission_actions_fun(member.permissions).map(
                        (action) => (
                          <span class="huggies-dao-permission">{action}</span>
                        ),
                      )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dao.open_roles.length > 0 && (
        <p class="huggies-dao-open-roles">
          ALSO OPEN TO EVERYONE:{" "}
          {dao.open_roles.map((role) => role.name).join(", ")} — any account can
          act in {dao.open_roles.length === 1 ? "that role" : "those roles"}.
        </p>
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
