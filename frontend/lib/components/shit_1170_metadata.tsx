// ========================================
// the token metadata block at the bottom of the $SHIT page: the price,
// the holder count, the total supply, the decimals, the reputation, the
// liquidity and the market cap.
//
// it reads the loaded summary and the loaded price from the page's
// store. it fetches nothing.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKENS_PAGE_SHIT_1170_STATE } from "../ts/tokens_page_shit_1170_state";
import { use_page_store_fun } from "../ts/use_page_store";
import { shit_total_supply_formatted_fun } from "../ts/tokens_page_shit_1170_holders";
import type { HUGGIES_SHIT_SUMMARY } from "../ts/tokens_page_shit_1170_summary";
import type { HUGGIES_SHIT_PRICE } from "../ts/tokens_page_shit_1170_price";
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
  const state = use_page_store_fun(HUGGIES_TOKENS_PAGE_SHIT_1170_STATE);
  const summary = state.summary;
  const price = state.price;
  // no summary yet — there is nothing to show.
  if (summary === null) return null;

  const price_usd =
    price !== null && price.price_usd > 0 ? price.price_usd : summary.price_usd;

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
      </div>
      {price !== null && price.price_error !== null && (
        <p class="huggies-shit-price-error">
          PRICE UNAVAILABLE: {price.price_error}
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
