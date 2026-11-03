// ========================================
// the token's own card on the token page: the icon, the symbol, the name, the
// id, the metadata grid, the description and the socials.
//
// it reads the loaded token from the page's store. it fetches nothing.
//
// --- WHY --- THE NAME AND THE ID ARE IN THE CARD AND NOT IN THE HEADER:
// the header holds the icon and the symbol, and it is the one thing on
// the page that is NOT a card. the name and the id are facts about the
// token, and the card is where the facts live — so they sit in the card
// with the description, each under its own label.
// ========================================
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../../ts/shared/mount_ids";
import { SHIT_1170_TOKEN_PAGE_TOKEN_STATE } from "../../../ts/token/index/token_page_token_state";
import { format_price_usd_fun } from "../../../ts/token/index/token_page_token_price_format";
import { use_page_store_fun } from "../../../ts/shared/use_page_store";
import { shit_1170_token_meta_grid_fun } from "../../shared/token_meta_grid";
import { shit_1170_token_meta_row_fun } from "../../shared/token_meta_grid";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function SHIT_1170_COMPONENT_TOKEN_DETAIL_FUN() {
  const state = use_page_store_fun(SHIT_1170_TOKEN_PAGE_TOKEN_STATE);
  const detail = state.detail;
  if (detail === null) return null;

  return (
    <>
      <header>
        {detail.icon !== null && <img class="icon" src={detail.icon} alt="" />}
        <div>
          <h1>{detail.symbol}</h1>
        </div>
      </header>
      {shit_1170_token_meta_grid_fun([
        { label: "PRICE", value: format_price_usd_fun(detail.price_usd) },
        { label: "REPUTATION", value: detail.reputation },
        { label: "HOLDERS", value: detail.holders.toLocaleString() },
        {
          label: "LIQUIDITY",
          value: format_price_usd_fun(detail.liquidity_usd),
        },
        {
          label: "MARKET CAP",
          value: format_price_usd_fun(detail.market_cap_usd),
        },
        { label: "DECIMALS", value: String(detail.decimals) },
      ])}
      <section class="description-card">
        {shit_1170_token_meta_row_fun("NAME", detail.name)}
        {shit_1170_token_meta_row_fun("CA", detail.id)}
        {detail.description !== null && (
          <>
            <h2>DESCRIPTION:</h2>
            <p class="description">{detail.description}</p>
          </>
        )}
      </section>
      {Object.keys(detail.socials).length > 0 && (
        <section class="socials">
          {Object.entries(detail.socials).map(([name, url]) => (
            <a
              key={name}
              class="social-link"
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
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_TOKEN_DETAIL;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_TOKEN_DETAIL_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
