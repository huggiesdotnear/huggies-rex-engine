// ========================================
// the DAO's own card on the DAO page: the name, the account id, the
// purpose, and the stats.
//
// it reads the loaded dao from the page's store. it fetches nothing.
// ========================================
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../../ts/shared/mount_ids";
import { SHIT_1170_DAO_PAGE_STATE } from "../../../ts/contract/sputnik-dao/contract_page_sputnik_dao_state";
import { use_page_store_fun } from "../../../ts/shared/use_page_store";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function SHIT_1170_COMPONENT_CONTRACT_SPUTNIK_DAO_HEADER_FUN() {
  const page_state = use_page_store_fun(SHIT_1170_DAO_PAGE_STATE);

  const state = page_state;
  const dao = state.dao;
  if (dao === null) return null;

  const member_total = dao.members.length;

  return (
    <>
      <header>
        <h1>
          {dao.name} <code>{dao.id}</code>
          {dao.purpose.length > 0 && <p>{dao.purpose}</p>}
        </h1>
        {/*========================================*/}
      </header>
      <section>
        <div>
          <strong>{dao.roles.length}</strong>
          <span>ROLES</span>
        </div>
        <div>
          <strong>{member_total}</strong>
          <span>MEMBERS</span>
        </div>
        <div>
          <strong>{dao.proposals.length}</strong>
          <span>PROPOSALS</span>
        </div>
      </section>
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_CONTRACT_SPUTNIK_DAO_HEADER;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<SHIT_1170_COMPONENT_CONTRACT_SPUTNIK_DAO_HEADER_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
