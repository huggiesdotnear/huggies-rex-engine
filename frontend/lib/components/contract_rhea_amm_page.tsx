// ========================================
// the Rhea AMM contract page.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { huggies_contract_coming_soon_fun } from "./contract_coming_soon";
// ========================================
// the Rhea AMM contract page component.
export function HUGGIES_COMPONENT_CONTRACT_RHEA_AMM_PAGE_FUN() {
  return (
    <>
      {huggies_contract_coming_soon_fun({
        title: "Rhea AMM",
        contract_id: "v2.ref-finance.near",
      })}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_RHEA_AMM_PAGE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_RHEA_AMM_PAGE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
