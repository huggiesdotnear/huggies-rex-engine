// ========================================
// the DAO's token balances: the same table the account page shows, so
// a dao and an account read the same way.
//
// the dao is an account — a contract account — so the row shape is the
// shared one and the ids link to the token pages.
//
// it reads the loaded balances from the page's store. it fetches
// nothing.
//
// mounts into
// <div id="HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_BALANCES">.
// ========================================
import { render } from "preact";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_DAO_PAGE_STATE } from "../ts/contract_page_sputnik_dao_state";
import { HUGGIES_AMOUNT_FORMAT } from "../ts/token_amount_format";
import { huggies_balance_row_fun } from "./balance_row";
// ========================================
// the native NEAR row is pinned above the sorted list: it is the gas
// balance a dao cannot operate without, so it is not competing for
// rank with the rest.
const HUGGIES_NEAR_ID = "near";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_BALANCES_FUN() {
  const [, set_revision] = use_state(0);

  use_effect(() => {
    const unsubscribe = HUGGIES_DAO_PAGE_STATE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const state = HUGGIES_DAO_PAGE_STATE.get();
  if (state.balances.length === 0) return null;

  // the native NEAR row is pinned; the rest are ordered by usd value,
  // biggest first.
  const near = state.balances.find((row) => row.id === HUGGIES_NEAR_ID);
  const rest = state.balances
    .filter((row) => row.id !== HUGGIES_NEAR_ID)
    .sort((a, b) => b.usd_value - a.usd_value);

  // the total covers the pinned row too, so it is not counted twice.
  const total_usd = state.balances.reduce((sum, row) => sum + row.usd_value, 0);

  return (
    <section class="huggies-dao-balances-section">
      <h2>BALANCES</h2>
      {/* the scroll box caps the height so a long token list never
          pushes the rest of the page off screen. the nesting is the
          account page's: the table block holds the scroll box, and the
          scroll box holds the table. the shared css is scoped to that
          order. */}
      <div class="huggies-balance-table">
        <div class="huggies-scroll">
          <table>
            <tbody>
              {near !== undefined &&
                huggies_balance_row_fun({
                  id: near.id,
                  raw: near.raw,
                  info: near.info,
                  usd_value: near.usd_value,
                  pinned: true,
                })}
              {rest.map((row) =>
                huggies_balance_row_fun({
                  id: row.id,
                  raw: row.raw,
                  info: row.info,
                  usd_value: row.usd_value,
                }),
              )}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">
                  TOTAL
                  <span class="huggies-total-usd">
                    {HUGGIES_AMOUNT_FORMAT.usd(total_usd)}
                  </span>
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_BALANCES;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_BALANCES_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
