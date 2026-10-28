// ========================================
// the token metadata block at the bottom of the $SHIT page: the price,
// the holder count, the total supply, the decimals, the reputation, the
// liquidity, the market cap and the LP-pool reference.
//
// it reads the loaded summary and the loaded price reference from the
// page's store. it fetches nothing.
import { render } from "preact";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKENS_PAGE_SHIT_1170_STATE } from "../ts/tokens_page_shit_1170_state";
import { shit_total_supply_formatted_fun } from "../ts/tokens_page_shit_1170_holders";
import type { HUGGIES_SHIT_SUMMARY } from "../ts/tokens_page_shit_1170_summary";
import type { HUGGIES_SHIT_PRICE_REF } from "../ts/tokens_page_shit_1170_price_ref";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// format a usd price with enough digits to stay readable.
function format_price_usd_fun(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "—";
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(8)}`;
}
// ========================================
// render one metadata row of the metadata grid.
function shit_meta_row_fun(label: string, value: string): preact.JSX.Element {
  return (
    <div class="huggies-token-meta-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_SHIT_1170_METADATA_FUN() {
  const [, set_revision] = use_state(0);

  use_effect(() => {
    const unsubscribe = HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const state = HUGGIES_TOKENS_PAGE_SHIT_1170_STATE.get();
  const summary = state.summary;
  const price_ref = state.price_ref;
  // no summary yet — there is nothing to show.
  if (summary === null) return null;

  const price_usd =
    price_ref !== null && price_ref.price_usd > 0
      ? price_ref.price_usd
      : summary.price_usd;

  return (
    <section class="huggies-shit-metadata">
      <h2>TOKEN METADATA</h2>
      <div class="huggies-token-meta">
        {shit_meta_row_fun("PRICE", format_price_usd_fun(price_usd))}
        {shit_meta_row_fun("HOLDERS", summary.holders.toLocaleString())}
        {shit_meta_row_fun(
          "TOTAL SUPPLY",
          shit_total_supply_formatted_fun(summary.total_supply),
        )}
        {shit_meta_row_fun("DECIMALS", String(summary.decimals))}
        {shit_meta_row_fun("REPUTATION", summary.reputation)}
        {shit_meta_row_fun(
          "LIQUIDITY",
          `$${summary.liquidity_usd.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}`,
        )}
        {shit_meta_row_fun(
          "MARKET CAP",
          `$${summary.market_cap_usd.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}`,
        )}
        {price_ref !== null &&
          price_ref.pool_label !== null &&
          shit_meta_row_fun("LP / POOL", price_ref.pool_label)}
        {price_ref !== null &&
          price_ref.pool_implied_price_usd !== null &&
          shit_meta_row_fun(
            "LP IMPLIED PRICE",
            format_price_usd_fun(price_ref.pool_implied_price_usd),
          )}
        {price_ref !== null &&
          price_ref.pool_tvl_usd !== null &&
          shit_meta_row_fun(
            "LP TVL",
            `$${price_ref.pool_tvl_usd.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}`,
          )}
      </div>
      {price_ref !== null && price_ref.pool_error !== null && (
        <p class="huggies-shit-pool-error">
          LP REFERENCE UNAVAILABLE: {price_ref.pool_error}
        </p>
      )}
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_SHIT_1170_METADATA;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_SHIT_1170_METADATA_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
