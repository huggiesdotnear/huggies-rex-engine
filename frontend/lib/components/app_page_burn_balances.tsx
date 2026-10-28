// ========================================
// the tokens the burn accounts hold, as cards.
//
// one card per token. the card carries the token's icon, its ticker,
// its id, the COMBINED balance of both burn accounts, and the share of
// the token's total supply that is burned.
//
// --- WHY --- cards and not a table: the burned amount is the point of
// the page, and a card says "this much of this token is gone" better
// than a row does. it also gives the balance and the percentage their
// own space, which a narrow table column cannot.
//
// --- WHY --- the balance is combined and not per account: the page
// answers one question — "how much is burned in total". the loader
// adds the two accounts up, so the card carries one number.
//
// this component does not fetch. it reads the page's store and renders.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_APP_PAGE_BURN_STORE } from "../ts/app_page_burn_store";
import { use_page_store_fun } from "../ts/use_page_store";
import { HUGGIES_AMOUNT_FORMAT } from "../ts/token_amount_format";
import { HUGGIES_SUPPLY_PERCENT } from "../ts/token_supply_percent";
import { token_detail_href_fun } from "../ts/token_link";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_APP_PAGE_BURN_BALANCES_FUN() {
  const page_data = use_page_store_fun(HUGGIES_APP_PAGE_BURN_STORE);
  const tokens = page_data?.tokens ?? [];
  const is_loading = page_data === null;

  return (
    <section>
      <h2>TOKEN BALANCES IN BURN ACCOUNT</h2>
      {is_loading && <p class="note">LOADING...</p>}
      {!is_loading && tokens.length === 0 && (
        <p class="note">NO TOKENS BURNED YET</p>
      )}
      <div class="token-list">
        {tokens.map((token) => (
          <a href={token_detail_href_fun(token.id)}>
            <div class="token-header">
              <span class="icon-wrap">
                {token.icon !== null ? (
                  <img class="icon" src={token.icon} alt="" />
                ) : (
                  <span class="icon-placeholder">{token.symbol.charAt(0)}</span>
                )}
              </span>
              <span class="token-info">
                <strong class="token-label">{token.symbol}</strong>
                <code class="token-id">{token.id}</code>
              </span>
            </div>
            <div class="token-details">
              <div class="token-detail">
                <span class="detail-label">BURNED</span>
                <span class="detail-value">
                  {HUGGIES_AMOUNT_FORMAT.balance(token.raw, {
                    decimals: token.decimals,
                  })}{" "}
                  {token.symbol}
                </span>
              </div>
              <div class="token-detail">
                <span class="detail-label">OF TOTAL SUPPLY</span>
                <span class="detail-value">
                  {HUGGIES_SUPPLY_PERCENT.format(token.percent)}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
      {page_data !== null && page_data.errors.length > 0 && (
        <div class="errors">
          {page_data.errors.map((error) => (
            <p class="note">{error}</p>
          ))}
        </div>
      )}
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_APP_PAGE_BURN_BALANCES;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_APP_PAGE_BURN_BALANCES_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
