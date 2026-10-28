// ========================================
// the DAO selector: the id jump box, plus a dropdown of the daos the
// signed-in account is a member of.
//
// the dropdown only appears when the reader has more than one dao to
// pick from. with one dao the box alone is enough, and with none
// there is nothing to pick.
//
// the box itself is shared — frontend/lib/components/id_jump_box.tsx
// — because the token page and the pumpopoly page have the same box
// with different wording.
//
// mounts into <div id="HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_SELECTOR">.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_AUTH } from "../ts/auth_status";
import { HUGGIES_DAO_PAGE_STATE } from "../ts/contract_page_sputnik_dao_state";
import { use_page_store_fun } from "../ts/use_page_store";
import { huggies_id_jump_box_fun } from "./id_jump_box";
import { HUGGIES_URL_ID } from "../ts/url_id";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the display name of a treasury, or its id when it has none.
function treasury_name_fun(treasury: {
  daoId: string;
  config: { name?: string } | null;
}): string {
  const name = treasury.config?.name;
  return typeof name === "string" && name.length > 0 ? name : treasury.daoId;
}
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_SELECTOR_FUN() {
  const page_state = use_page_store_fun(HUGGIES_DAO_PAGE_STATE);

  const state = page_state;
  // --- WHY --- the shared lib/ts/url_id.ts does the reading: the trim
  // and the blank-means-absent rule live there, so this box and the
  // page's own loader cannot drift apart on which dao is shown.
  const dao_id = HUGGIES_URL_ID.read();

  // --- WHY --- the dropdown only shows when there is a real choice to
  // make. one dao and the box is enough; none and there is nothing to
  // pick.
  const has_choice = state.treasuries.length > 1;

  const open_dao_fun = (next_id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("id", next_id);
    window.location.href = url.toString();
  };

  return (
    <>
      {huggies_id_jump_box_fun({
        id: dao_id,
        label: "DAO ACCOUNT ID",
        placeholder: "dao.sputnik-dao.near",
        button_text: "OPEN DAO",
        param_name: "id",
        class_prefix: "huggies-dao",
      })}
      {has_choice && (
        <label class="huggies-dao-select">
          <span>YOUR DAOS</span>
          <select
            value={dao_id ?? ""}
            onChange={(event) => {
              open_dao_fun((event.currentTarget as HTMLSelectElement).value);
            }}
          >
            {state.treasuries.map((treasury) => (
              <option value={treasury.daoId}>
                {treasury_name_fun(treasury)}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_SELECTOR;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    HUGGIES_AUTH.init();
    render(<HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_SELECTOR_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
