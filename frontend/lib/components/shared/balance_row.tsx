// ========================================
// the shared row shape for every account balance table: icon, ticker and
// contract id on one line, the human balance and usd value on the next.
// every balance table renders through this, so they cannot drift.
//
// --- WHY --- this exists because they already did: each table had its own
// copy of this markup, and the copies were why the tables still looked
// different after the styling moved to a shared class.
import type { HUGGIES_TOKEN_INFO } from "../../ts/token_info";
import { HUGGIES_AMOUNT_FORMAT } from "../../ts/token_amount_format";
import { token_amount_display_fun } from "../../ts/token_amount_display";
import { token_detail_href_fun } from "../../ts/token_link";
import { current_app_depth_fun } from "../../ts/app_depth";
// ========================================
// ========================================
// --- ICON ------------------------------
// the token's icon when it has one, else a neutral dot so every row keeps
// the same alignment.
// --- WHY --- the api's data uri is used directly: it is already
// self-contained, so no extra request and no origin problem.
function huggies_token_icon_fun(
  icon: string | null,
  symbol: string,
): preact.JSX.Element {
  if (icon === null) {
    return <span class="token-icon is-empty" aria-hidden="true" />;
  }
  return (
    <img
      class="token-icon"
      src={icon}
      alt=""
      width={20}
      height={20}
      loading="lazy"
      title={symbol}
    />
  );
}
// ========================================
// ========================================
// --- ROW -------------------------------
// --- WHY --- keyed by token id, not symbol: symbols are not unique (two
// different tokens can share one, verified on live data).
export function huggies_balance_row_fun(props: {
  id: string;
  raw: string;
  info: HUGGIES_TOKEN_INFO;
  usd_value?: number;
  pinned?: boolean;
}): preact.JSX.Element {
  const { id, raw, info, usd_value, pinned } = props;
  // the one shared amount presentation, so the account row and the holders
  // table always show the same numbers the same way.
  const amount = token_amount_display_fun(raw, info);
  return (
    <tr key={id} class={pinned === true ? "is-pinned" : undefined}>
      <td>
        <div class="row-head">
          {huggies_token_icon_fun(info.icon, info.symbol)}
          <span class="ticker">{info.symbol}</span>
          {/* the full contract id sits on row one, clipped so a long id
              cannot push the row wider than the page. the title holds the
              complete value and the text stays selectable. */}
          <a
            class="contract"
            title={id}
            href={token_detail_href_fun(id, current_app_depth_fun())}
          >
            {id}
          </a>
        </div>
        <div class="amounts">
          <span class="amount">{amount.decimal}</span>
          <span class="usd">
            {usd_value === undefined
              ? amount.usd
              : HUGGIES_AMOUNT_FORMAT.usd(usd_value)}
          </span>
        </div>
      </td>
    </tr>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
