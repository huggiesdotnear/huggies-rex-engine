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
  const member_total = dao.members.length;

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
          <span class="huggies-dao-stat-value">{member_total}</span>
          <span class="huggies-dao-stat-label">MEMBERS</span>
        </article>
        <article class="huggies-dao-stat">
          <span class="huggies-dao-stat-value">{dao.proposals.length}</span>
          <span class="huggies-dao-stat-label">PROPOSALS</span>
        </article>
      </section>
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
