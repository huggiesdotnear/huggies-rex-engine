// ========================================
// what burning on NEAR means, and what a burn address is.
//
// the section is static text — it is the same on every visit and it is
// never fetched. so it is a constant, not a loader and not a store.
//
// --- WHY --- "What is Burning?" and "Burn Addresses" are cards: they
// are two short ideas side by side, and a reader takes one of them in
// at a time. a single paragraph of both would be a wall.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_APP_PAGE_BURN_INFO_FUN() {
  return (
    <section class="huggies-burn-info">
      <h2>ABOUT BURNING ON NEAR</h2>
      <div class="huggies-burn-info-list">
        <div class="huggies-burn-info-card">
          <h3>WHAT IS BURNING?</h3>
          <p>
            Burning refers to the process of permanently removing tokens or
            accounts from circulation on the NEAR blockchain. This is typically
            done by sending tokens to an inaccessible address or by removing all
            access keys from an account, effectively locking it forever.
          </p>
        </div>
        <div class="huggies-burn-info-card">
          <h3>BURN ADDRESSES</h3>
          <p>
            A burn address is an account with no access keys, making it
            impossible to spend tokens sent to it. Anyone can create a burn
            address by creating a new account and then removing all its access
            keys.
          </p>
        </div>
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_APP_PAGE_BURN_INFO;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_APP_PAGE_BURN_INFO_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
