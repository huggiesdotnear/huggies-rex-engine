// ========================================
// the token's own card on the token page: the icon, the symbol, the
// name, the id, the metadata grid, the description and the socials.
//
// it reads the loaded token from the page's store. it fetches nothing.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_TOKEN_PAGE_TOKEN_STATE } from "../ts/token_page_token_state";
import { format_price_usd_fun } from "../ts/token_page_token_price_format";
import { use_page_store_fun } from "../ts/use_page_store";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// render one metadata value for the detail grid.
function token_metadata_row_fun(
  label: string,
  value: string,
): preact.JSX.Element {
  return (
    <div class="huggies-token-meta-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_TOKEN_DETAIL_FUN() {
  const state = use_page_store_fun(HUGGIES_TOKEN_PAGE_TOKEN_STATE);
  const detail = state.detail;
  if (detail === null) return null;

  return (
    <>
      <header class="huggies-token-detail-header">
        {detail.icon !== null && (
          <img class="huggies-token-detail-icon" src={detail.icon} alt="" />
        )}
        <div>
          <h1>{detail.symbol}</h1>
          <p>{detail.name}</p>
          <code>{detail.id}</code>
        </div>
      </header>
      <section class="huggies-token-meta">
        {token_metadata_row_fun(
          "PRICE",
          format_price_usd_fun(detail.price_usd),
        )}
        {token_metadata_row_fun("REPUTATION", detail.reputation)}
        {token_metadata_row_fun("HOLDERS", detail.holders.toLocaleString())}
        {token_metadata_row_fun(
          "LIQUIDITY",
          format_price_usd_fun(detail.liquidity_usd),
        )}
        {token_metadata_row_fun(
          "MARKET CAP",
          format_price_usd_fun(detail.market_cap_usd),
        )}
        {token_metadata_row_fun("DECIMALS", String(detail.decimals))}
      </section>
      {detail.description !== null && (
        <section class="huggies-token-description-card">
          <h2>DESCRIPTION:</h2>
          <p class="huggies-token-description">{detail.description}</p>
        </section>
      )}
      {Object.keys(detail.socials).length > 0 && (
        <section class="huggies-token-socials">
          {Object.entries(detail.socials).map(([name, url]) => (
            <a
              key={name}
              class="huggies-token-social-link"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              {name.toUpperCase()}
            </a>
          ))}
        </section>
      )}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TOKEN_DETAIL;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_TOKEN_DETAIL_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
