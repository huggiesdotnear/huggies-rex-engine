// ========================================
// the DAO's policy roles: one tab per role, and the accounts in it.
//
// the roles are the tabs because a reader wants one of them — "who
// can approve?" — not all of them at once. the tab shows the role's
// name and how many accounts are in it, so the reader can see what is
// there before picking.
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
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_ROLES_FUN() {
  const [, set_revision] = use_state(0);
  // the role the reader is looking at. null means the first one.
  const [active_role, set_active_role] = use_state<string | null>(null);

  use_effect(() => {
    const unsubscribe = HUGGIES_DAO_PAGE_STATE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const state = HUGGIES_DAO_PAGE_STATE.get();
  const dao = state.dao;
  if (dao === null) return null;

  if (dao.roles.length === 0) {
    return (
      <section class="huggies-dao-roles-section">
        <h2>MEMBERS / POLICY ROLES</h2>
        <p class="huggies-dao-empty">NO POLICY ROLES</p>
      </section>
    );
  }

  // the role on show: the one the reader picked, or the first.
  const active =
    dao.roles.find((role) => role.name === active_role) ?? dao.roles[0];
  const depth = current_app_depth_fun();

  return (
    <section class="huggies-dao-roles-section">
      <h2>MEMBERS / POLICY ROLES</h2>
      <div class="huggies-dao-tabs" role="tablist" aria-label="policy roles">
        {dao.roles.map((role) => (
          <button
            type="button"
            role="tab"
            class={
              role.name === active.name
                ? "huggies-dao-tab is-active"
                : "huggies-dao-tab"
            }
            aria-selected={role.name === active.name}
            onClick={() => set_active_role(role.name)}
          >
            {role.name}
            <span class="huggies-dao-tab-count">{role.members.length}</span>
          </button>
        ))}
      </div>
      {active.members.length === 0 ? (
        <p class="huggies-dao-empty">NO MEMBERS IN THIS ROLE</p>
      ) : (
        <div class="huggies-dao-members-scroll">
          <table class="huggies-dao-members-table">
            <thead>
              <tr>
                <th class="huggies-dao-member-rank">#</th>
                <th class="huggies-dao-member-account">ACCOUNT</th>
                <th class="huggies-dao-member-permissions">PERMISSIONS</th>
              </tr>
            </thead>
            <tbody>
              {active.members.map((member, index) => (
                <tr key={member}>
                  <td class="huggies-dao-member-rank">{index + 1}</td>
                  <td class="huggies-dao-member-account">
                    <a
                      href={`${"../".repeat(depth)}account.html?id=${encodeURIComponent(member)}`}
                    >
                      {member}
                    </a>
                  </td>
                  <td class="huggies-dao-member-permissions">
                    {active.permissions.length === 0
                      ? "—"
                      : active.permissions.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  if (el !== null)
    render(<HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_ROLES_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
