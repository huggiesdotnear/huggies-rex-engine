// ========================================
// the token metadata block at the bottom of the $SHIT page: the price,
// the holder count, the total supply, the decimals, the reputation, the
// liquidity and the market cap.
//
// it reads the loaded summary from the page's store. it fetches
// nothing.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKEN_PAGE_SHIT_1170_STATE } from "../ts/token_page_shit_1170_state";
import { use_page_store_fun } from "../ts/use_page_store";
import { shit_total_supply_formatted_fun } from "../ts/token_page_shit_1170_holders";
import { huggies_token_meta_grid_fun } from "./shared/token_meta_grid";
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
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_METADATA_FUN() {
  const state = use_page_store_fun(HUGGIES_TOKEN_PAGE_SHIT_1170_STATE);
  const summary = state.summary;
  // no summary yet — there is nothing to show.
  if (summary === null) return null;

  // the price comes from the summary request. it is 0 when the api has
  // no price for the token, which is "unknown", not "$0.00".
  const price_usd = summary.price_usd;

  return (
    <section class="metadata">
      <h2>TOKEN METADATA</h2>
      {huggies_token_meta_grid_fun([
        { label: "PRICE", value: format_price_usd_fun(price_usd) },
        { label: "HOLDERS", value: summary.holders.toLocaleString() },
        {
          label: "TOTAL SUPPLY",
          value: shit_total_supply_formatted_fun(summary.total_supply),
        },
        { label: "DECIMALS", value: String(summary.decimals) },
        { label: "REPUTATION", value: summary.reputation },
        {
          label: "LIQUIDITY",
          value: `$${summary.liquidity_usd.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}`,
        },
        {
          label: "MARKET CAP",
          value: `$${summary.market_cap_usd.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}`,
        },
      ])}
      {price_usd <= 0 && (
        <p class="price-error">
          PRICE UNAVAILABLE: the api reported no price for this token
        </p>
      )}
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_METADATA;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<HUGGIES_COMPONENT_TOKEN_PAGE_SHIT_1170_METADATA_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
