// ========================================
// the INTEAR DEX engine contract page.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { huggies_contract_coming_soon_fun } from "./contract_coming_soon";
// ========================================
// the INTEAR DEX engine contract page component.
export function HUGGIES_COMPONENT_CONTRACT_INTEAR_DEX_PAGE_FUN() {
  return (
    <>
      {huggies_contract_coming_soon_fun({
        title: "INTEAR DEX engine",
        contract_id: "dex.intear.near",
      })}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_INTEAR_DEX_PAGE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_INTEAR_DEX_PAGE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
