// ========================================
// the community burn addresses, as cards.
//
// one card per burn address. each card links to that address's account
// page, so a reader can see the whole account — its transactions and
// everything else the account page shows — and not just the burned
// tokens.
//
// this component does not fetch. the addresses are a constant
// (lib/ts/app_page_burn_addresses.ts), and the page's loader is the one
// that reads their balances.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_BURN_ADDRESSES } from "../ts/app_page_burn_addresses";
import { current_app_depth_fun } from "../ts/app_depth";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the link to an account's page, relative to the page the link is
// rendered on.
function account_href_fun(account_id: string): string {
  const depth = current_app_depth_fun();
  return `${"../".repeat(depth)}account.html?id=${encodeURIComponent(account_id)}`;
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_APP_PAGE_BURN_ADDRESSES_FUN() {
  return (
    <section>
      <h2>COMMUNITY BURN ADDRESSES</h2>
      <div>
        {HUGGIES_BURN_ADDRESSES.map((account_id) => (
          <a href={account_href_fun(account_id)}>
            <span class="emoji">🔥</span>
            <span>
              <strong>BURN ADDRESS</strong>
              <code>{account_id}</code>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_APP_PAGE_BURN_ADDRESSES;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<HUGGIES_COMPONENT_APP_PAGE_BURN_ADDRESSES_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
