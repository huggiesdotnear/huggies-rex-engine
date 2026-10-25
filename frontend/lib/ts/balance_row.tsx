// ========================================
// the shared row shape for every account balance table: icon, ticker,
// balance and usd on one line, the contract id clipped underneath.
// both the direct balance table and the rhea deposit table render
// through this, so the two cannot drift apart.
// --- WHY --- this exists because they already did drift: both tables
// had their own copy of this markup, and when the styling moved to a
// shared class the copies were the reason the tables still looked
// different. one row renderer, one appearance.
import type { HUGGIES_TOKEN_INFO } from "./token_info";
import { HUGGIES_AMOUNT_FORMAT } from "./token_amount_format";
import { token_detail_href_fun } from "./token_link";
import { current_app_depth_fun } from "./app_depth";
// ========================================
// ========================================
// --- ICON ------------------------------
// the token's icon when it has one, else a neutral dot so every row
// keeps the same alignment.
// --- WHY --- <img> with the api's data: url directly: the icon field is
// already a self-contained data uri, so there is no extra request and
// no origin problem to configure.
export function huggies_token_icon_fun(
  icon: string | null,
  symbol: string,
): preact.JSX.Element {
  if (icon === null) {
    return (
      <span
        class="huggies-token-icon huggies-token-icon--empty"
        aria-hidden="true"
      />
    );
  }
  return (
    <img
      class="huggies-token-icon"
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
// one token, every field stacked in a single cell so the table never
// needs horizontal scrolling.
// --- WHY --- keyed by token id, not symbol: symbols are not unique
// (two different tokens can share one, verified on live data).
export function huggies_balance_row_fun(props: {
  id: string;
  raw: string;
  info: HUGGIES_TOKEN_INFO;
  usd_value?: number;
  pinned?: boolean;
  tag?: string;
}): preact.JSX.Element {
  const { id, raw, info, usd_value, pinned, tag } = props;
  const usd = usd_value ?? HUGGIES_AMOUNT_FORMAT.balance_usd(raw, info);
  return (
    <tr key={id} class={pinned === true ? "is-pinned" : undefined}>
      <td>
        <div class="huggies-row-head">
          {huggies_token_icon_fun(info.icon, info.symbol)}
          <span class="huggies-ticker">{info.symbol}</span>
          {tag !== undefined && <span class="huggies-pinned-tag">{tag}</span>}
          <span class="huggies-amounts">
            <span class="huggies-amount">
              {HUGGIES_AMOUNT_FORMAT.balance(raw, info)}
            </span>
            <span class="huggies-usd">{HUGGIES_AMOUNT_FORMAT.usd(usd)}</span>
          </span>
        </div>
        {/* the full contract id stays selectable and copyable, and is
            in the title so a clipped id can still be read. */}
        <a
          class="huggies-contract"
          title={id}
          href={token_detail_href_fun(id, current_app_depth_fun())}
        >
          {id}
        </a>
      </td>
    </tr>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
