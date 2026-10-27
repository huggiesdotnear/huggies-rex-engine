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
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_AUTH } from "../ts/auth_status";
import { HUGGIES_DAO_PAGE_STATE } from "../ts/contract_page_sputnik_dao_state";
import { huggies_id_jump_box_fun } from "./id_jump_box";
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
  const [, set_revision] = use_state(0);

  use_effect(() => {
    const unsubscribe = HUGGIES_DAO_PAGE_STATE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const state = HUGGIES_DAO_PAGE_STATE.get();
  const dao_id = new URLSearchParams(window.location.search).get("dao_id");

  // --- WHY --- the dropdown only shows when there is a real choice to
  // make. one dao and the box is enough; none and there is nothing to
  // pick.
  const has_choice = state.treasuries.length > 1;

  const open_dao_fun = (next_id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("dao_id", next_id);
    window.location.href = url.toString();
  };

  return (
    <>
      {huggies_id_jump_box_fun({
        id: dao_id,
        label: "DAO ACCOUNT ID",
        placeholder: "dao.sputnik-dao.near",
        button_text: "OPEN DAO",
        param_name: "dao_id",
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
