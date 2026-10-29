// ========================================
// the Rhea contract page.
//
// one page for both rhea contracts — the ref finance v2 amm and the
// ref labs dcl v2 — because they are the same family of rhea contracts
// and a visitor looking for one wants the other one click away.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { huggies_contract_coming_soon_fun } from "./shared/contract_coming_soon";
// ========================================
// the Rhea contract page component.
function HUGGIES_COMPONENT_CONTRACT_PAGE_RHEA_PAGE_FUN() {
  return (
    <>
      {huggies_contract_coming_soon_fun({
        title: "Rhea",
        contract_ids: ["v2.ref-finance.near", "dclv2.ref-labs.near"],
      })}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_PAGE_RHEA_PAGE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_PAGE_RHEA_PAGE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
