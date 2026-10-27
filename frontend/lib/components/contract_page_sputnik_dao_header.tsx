// ========================================
// the DAO's own card on the DAO page: the name, the account id, the
// purpose, and the stats.
//
// it reads the loaded dao from the page's store. it fetches nothing.
// ========================================
import { render } from "preact";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_DAO_PAGE_STATE } from "../ts/contract_page_sputnik_dao_state";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// format a yoctoNEAR amount as NEAR.
function format_near_fun(yocto: string): string {
  if (yocto.length === 0) return "—";
  const value = Number(yocto);
  if (!Number.isFinite(value)) return "—";
  return `${(value / 10 ** 24).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  })} NEAR`;
}
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_HEADER_FUN() {
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

  // the number of accounts in every role, counted once.
  const member_total = dao.roles.reduce(
    (sum, role) => sum + role.members.length,
    0,
  );
  const unique_members = new Set(dao.roles.flatMap((role) => role.members))
    .size;

  return (
    <>
      <header class="huggies-dao-header">
        <h1>{dao.name}</h1>
        <code>{dao.id}</code>
      </header>
      {dao.purpose.length > 0 && (
        <p class="huggies-dao-purpose">{dao.purpose}</p>
      )}
      <section class="huggies-dao-stats">
        <article class="huggies-dao-stat">
          <span class="huggies-dao-stat-value">{dao.roles.length}</span>
          <span class="huggies-dao-stat-label">ROLES</span>
        </article>
        <article class="huggies-dao-stat">
          <span class="huggies-dao-stat-value">{unique_members}</span>
          <span class="huggies-dao-stat-label">MEMBERS</span>
        </article>
        <article class="huggies-dao-stat">
          <span class="huggies-dao-stat-value">{dao.proposals.length}</span>
          <span class="huggies-dao-stat-label">PROPOSALS</span>
        </article>
        <article class="huggies-dao-stat">
          <span class="huggies-dao-stat-value">
            {format_near_fun(dao.available_amount)}
          </span>
          <span class="huggies-dao-stat-label">AVAILABLE</span>
        </article>
      </section>
      {member_total === 0 && dao.roles.length > 0 && (
        <p class="huggies-dao-empty">NO MEMBERS IN ANY ROLE</p>
      )}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_HEADER;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_HEADER_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
