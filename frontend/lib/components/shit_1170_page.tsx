// ========================================
// dedicated SHIT token page: the holder tabs, the share of the supply
// each group of holders holds, the full holder list, and the token
// metadata at the bottom of the page.
// ========================================
import { render } from "preact";
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { current_app_depth_fun } from "../ts/app_depth";
import { HUGGIES_SHIT_FILTERS } from "../ts/shit_filters";
import {
  fetch_shit_holders_fun,
  shit_holder_icon_fun,
  shit_holder_type_label_fun,
  shit_total_supply_formatted_fun,
  type HUGGIES_SHIT_HOLDER,
  type HUGGIES_SHIT_HOLDER_TYPE,
} from "../ts/shit_holders";
import {
  shit_holder_groups_fun,
  type HUGGIES_SHIT_HOLDER_GROUP,
} from "../ts/shit_holder_groups";
import { fetch_shit_price_ref_fun } from "../ts/shit_price_ref";
import { fetch_shit_summary_fun } from "../ts/shit_summary";
import { HUGGIES_SHIT_TOKEN_ID } from "../ts/shit_config";
import type { HUGGIES_SHIT_SUMMARY } from "../ts/shit_summary";
import type { HUGGIES_SHIT_PRICE_REF } from "../ts/shit_price_ref";
// ========================================
// the filter currently applied to the holder list.
type HUGGIES_SHIT_ACTIVE_FILTER = HUGGIES_SHIT_HOLDER_TYPE | "all";
// ========================================
// --- HELPERS ----------------------------
// the link to the account page of one holder.
function holder_account_href_fun(account_id: string, depth: number): string {
  const prefix = "../".repeat(Math.max(0, depth));
  return `${prefix}account.html?id=${encodeURIComponent(account_id)}`;
}
// ========================================
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
// render the token metadata block, at the bottom of the page.
function render_metadata_fun(
  summary: HUGGIES_SHIT_SUMMARY,
  price_ref: HUGGIES_SHIT_PRICE_REF | null,
): preact.JSX.Element {
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
        {shit_meta_row_fun("TOTAL SUPPLY", shit_total_supply_formatted_fun())}
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
// render the filter tabs: one emoji per holder type.
function render_filters_fun(
  active_filter: HUGGIES_SHIT_ACTIVE_FILTER,
  on_filter_fun: (filter: HUGGIES_SHIT_ACTIVE_FILTER) => void,
): preact.JSX.Element {
  return (
    <div class="huggies-shit-tabs" role="tablist" aria-label="holder types">
      {HUGGIES_SHIT_FILTERS.map((filter) => (
        <button
          type="button"
          role="tab"
          class={
            filter.key === active_filter
              ? "huggies-shit-tab is-active"
              : "huggies-shit-tab"
          }
          aria-selected={filter.key === active_filter}
          aria-label={filter.label}
          title={filter.label}
          onClick={() => on_filter_fun(filter.key)}
        >
          {filter.icon !== "" ? filter.icon : "💩"}
        </button>
      ))}
    </div>
  );
}
// ========================================
// render the share of the supply each group of holders holds.
//
// the groups are a grid of flat white cards, the old SHIT info page's
// `.filter-btn` look, with a coloured stripe down the left edge for
// the type. the card of the ACTIVE tab is the filled-in one.
function render_groups_fun(
  groups: HUGGIES_SHIT_HOLDER_GROUP[],
  active_filter: HUGGIES_SHIT_ACTIVE_FILTER,
): preact.JSX.Element {
  return (
    <section class="huggies-shit-groups">
      <h2>HOLDERS BY GROUP</h2>
      <ul class="huggies-shit-groups-list">
        {groups.map((group) => (
          <li
            key={group.type}
            class={`huggies-shit-group is-${group.type}${
              group.type === active_filter ? " is-active" : ""
            }`}
          >
            <span class="huggies-shit-group-left">
              <span class="huggies-shit-group-icon">
                {shit_holder_icon_fun(group.type)}
              </span>
              <span class="huggies-shit-group-name">
                {shit_holder_type_label_fun(group.type)}
              </span>
            </span>
            <span class="huggies-shit-group-right">
              <span class="huggies-shit-group-count">
                {group.count.toLocaleString()}
              </span>
              <span class="huggies-shit-group-percent">
                {group.percent_formatted}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
// ========================================
// render one holder row.
function render_holder_fun(
  holder: HUGGIES_SHIT_HOLDER,
  rank: number,
  depth: number,
): preact.JSX.Element {
  return (
    <tr class={`huggies-shit-holder is-${holder.type}`}>
      <td class="huggies-shit-holder-rank">{rank}</td>
      <td>
        <span class="huggies-shit-holder-type">
          {shit_holder_icon_fun(holder.type)}
        </span>
        <a
          class="huggies-shit-holder-account"
          href={holder_account_href_fun(holder.account_id, depth)}
        >
          {holder.account_id}
        </a>
      </td>
      <td class="huggies-shit-holder-amount" title={holder.balance}>
        {holder.amount_formatted}
      </td>
      <td class="huggies-shit-holder-usd">{holder.usd_formatted}</td>
      <td class="huggies-shit-holder-percent">{holder.percent_formatted}</td>
      <td>
        <span class={`huggies-shit-holder-tag is-${holder.type}`}>
          {shit_holder_type_label_fun(holder.type)}
        </span>
      </td>
    </tr>
  );
}
// ========================================
// the legend that explains the holder types.
function render_legend_fun(): preact.JSX.Element {
  return (
    <p class="huggies-shit-legend">
      🔄 dex accounts
      <br />
      👤 regular holders
      <br />
      🏦 huggies holding accounts
      <br />
      👨‍💻 all my "dev" accounts for full transparency
      <br />
      🖼️ these near accounts are/were available as NFTs on{" "}
      <a href="https://namesky.app/" target="_blank" rel="noreferrer">
        NAMESKY
      </a>
    </p>
  );
}
// ========================================
// --- COMPONENT --------------------------
// the dedicated SHIT token page component.
export function HUGGIES_COMPONENT_SHIT_1170_PAGE_FUN() {
  const [summary, set_summary] = use_state<HUGGIES_SHIT_SUMMARY | null>(null);
  const [price_ref, set_price_ref] = use_state<HUGGIES_SHIT_PRICE_REF | null>(
    null,
  );
  const [holders, set_holders] = use_state<HUGGIES_SHIT_HOLDER[]>([]);
  const [holder_total, set_holder_total] = use_state(0);
  const [next_cursor, set_next_cursor] = use_state<string | null>(null);
  const [active_filter, set_active_filter] =
    use_state<HUGGIES_SHIT_ACTIVE_FILTER>("all");
  const [loading, set_loading] = use_state(true);
  const [loading_more, set_loading_more] = use_state(false);
  const [error, set_error] = use_state<string | null>(null);

  // --- WHY --- the holder price depends on the price, so the first
  // page is loaded only once the price is known — otherwise every usd
  // column would render as "$0.00".
  use_effect(() => {
    let cancelled = false;
    set_loading(true);
    set_error(null);
    void Promise.all([fetch_shit_summary_fun(), fetch_shit_price_ref_fun()])
      .then(async ([loaded_summary, loaded_price_ref]) => {
        if (cancelled) return;
        set_summary(loaded_summary);
        set_price_ref(loaded_price_ref);
        const price_usd =
          loaded_price_ref.price_usd > 0
            ? loaded_price_ref.price_usd
            : (loaded_summary?.price_usd ?? 0);
        const page = await fetch_shit_holders_fun(null, price_usd);
        if (cancelled) return;
        set_holders(page.rows);
        set_holder_total(page.total);
        set_next_cursor(page.next_cursor);
        set_loading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        set_error(err instanceof Error ? err.message : String(err));
        set_loading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const load_more_fun = () => {
    if (next_cursor === null || loading_more) return;
    set_loading_more(true);
    const cursor = next_cursor;
    const price_usd = price_ref?.price_usd ?? summary?.price_usd ?? 0;
    void fetch_shit_holders_fun(cursor, price_usd)
      .then((page) => {
        set_holders((current) => [...current, ...page.rows]);
        set_holder_total(page.total);
        set_next_cursor(page.next_cursor);
      })
      .catch((err: unknown) => {
        set_error(err instanceof Error ? err.message : String(err));
      })
      .finally(() => set_loading_more(false));
  };

  const filtered_holders =
    active_filter === "all"
      ? holders
      : holders.filter((holder) => holder.type === active_filter);

  // the share of the supply each group of holders holds.
  const groups = shit_holder_groups_fun(holders);

  if (loading) return <div class="huggies-shit">LOADING SHIT...</div>;

  return (
    <div class="huggies-shit">
      {error !== null && <p class="huggies-shit-error">{error}</p>}
      <header class="huggies-shit-header">
        <h1>{HUGGIES_SHIT_TOKEN_ID}</h1>
      </header>
      {render_groups_fun(groups, active_filter)}
      <section class="huggies-shit-holders">
        <h2>
          HOLDERS (
          {active_filter === "all" ? holder_total : filtered_holders.length}
          {active_filter === "all" ? "" : ` OF ${holder_total}`})
        </h2>
        {render_filters_fun(active_filter, (filter) =>
          set_active_filter(filter),
        )}
        {filtered_holders.length === 0 ? (
          <p>NO HOLDERS IN THIS CATEGORY</p>
        ) : (
          <div class="huggies-shit-holders-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>ACCOUNT</th>
                  <th>AMOUNT</th>
                  <th>USD</th>
                  <th>% OF SUPPLY</th>
                  <th>TYPE</th>
                </tr>
              </thead>
              <tbody>
                {filtered_holders.map((holder, index) =>
                  render_holder_fun(holder, index + 1, current_app_depth_fun()),
                )}
              </tbody>
            </table>
          </div>
        )}
        {next_cursor !== null && (
          <button type="button" disabled={loading_more} onClick={load_more_fun}>
            {loading_more ? "LOADING..." : "LOAD MORE"}
          </button>
        )}
        {render_legend_fun()}
      </section>
      {summary !== null && render_metadata_fun(summary, price_ref)}
    </div>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_SHIT_1170_PAGE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_SHIT_1170_PAGE_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
