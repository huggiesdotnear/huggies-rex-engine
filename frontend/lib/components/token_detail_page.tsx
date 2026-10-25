// ========================================
// token metadata, indexed holders, and dex pools detail page.
// ========================================
import { render } from "preact";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import {
  fetch_token_detail_fun,
  fetch_token_holders_fun,
} from "../ts/token_detail_fetch";
import type {
  HUGGIES_TOKEN_DETAIL,
  HUGGIES_TOKEN_HOLDER,
} from "../ts/token_detail";
import { load_token_pools_fun } from "../ts/token_pools";
import { pool_scope_label_fun } from "../ts/pool_load";
import { token_detail_href_fun } from "../ts/token_link";
import { current_app_depth_fun } from "../ts/app_depth";
import { HUGGIES_TOKEN_INFO } from "../ts/token_info";
import { token_holder_row_fun } from "../ts/token_holder_row";
import { HUGGIES_SHIT_TOKEN_ID } from "../ts/shit_config";
import type { HUGGIES_POOL } from "../ts/pool";
// ========================================
// read the token id from the page query string.
function token_id_from_url_fun(): string | null {
  if (typeof window === "undefined") return null;
  const id = new URLSearchParams(window.location.search).get("id");
  return id !== null && id.length > 0 ? id : null;
}
// ========================================
// format one metadata value for the detail grid.
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
// render one pool row.
function pool_row_fun(pool: HUGGIES_POOL): preact.JSX.Element {
  return (
    <li>
      <strong>{pool.dex_name}</strong>
      <span>POOL {pool.pool_id}</span>
      <code>
        {pool.token_ids.map((token_id, index) => (
          <span>
            {index > 0 ? " / " : ""}
            <a href={token_detail_href_fun(token_id, current_app_depth_fun())}>
              {token_id}
            </a>
          </span>
        ))}
      </code>
    </li>
  );
}
// ========================================
// render the bounded pool scope for one dex.
function pool_scope_fun(pool: HUGGIES_POOL): preact.JSX.Element {
  return (
    <p class="huggies-token-pool-scope">
      {pool.dex_name}: {pool_scope_label_fun(pool.dex)}
    </p>
  );
}
// ========================================
// token detail page component.
function HUGGIES_COMPONENT_TOKEN_DETAIL_PAGE_FUN() {
  const token_id = token_id_from_url_fun();
  const [detail, set_detail] = use_state<HUGGIES_TOKEN_DETAIL | null>(null);
  const [holders, set_holders] = use_state<HUGGIES_TOKEN_HOLDER[]>([]);
  const [holder_total, set_holder_total] = use_state(0);
  const [next_cursor, set_next_cursor] = use_state<string | null>(null);
  const [pools, set_pools] = use_state<HUGGIES_POOL[]>([]);
  const [loading_more, set_loading_more] = use_state(false);
  const [error, set_error] = use_state<string | null>(null);
  // the token's decimals and price, needed to turn a raw holder
  // balance into a readable amount and a usd value.
  const [info, set_info] = use_state<HUGGIES_TOKEN_INFO | null>(null);

  use_effect(() => {
    if (token_id === null) return;
    let cancelled = false;
    set_error(null);
    void Promise.all([
      fetch_token_detail_fun(token_id),
      fetch_token_holders_fun(token_id, null),
      load_token_pools_fun(token_id),
      HUGGIES_TOKEN_INFO.get([token_id]),
    ])
      .then(([token, holder_page, token_pools, info_map]) => {
        if (cancelled) return;
        set_detail(token);
        set_holders(holder_page.rows);
        set_holder_total(holder_page.total);
        set_next_cursor(holder_page.next_cursor);
        set_pools(token_pools);
        set_info(info_map.get(token_id) ?? null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        set_error(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [token_id]);

  const load_more_fun = () => {
    if (token_id === null || next_cursor === null || loading_more) return;
    set_loading_more(true);
    const cursor = next_cursor;
    void fetch_token_holders_fun(token_id, cursor)
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

  if (token_id === null) return <p>TOKEN ID MISSING</p>;
  if (error !== null) return <p>{error}</p>;
  if (detail === null) return <p>LOADING TOKEN...</p>;

  return (
    <article class="huggies-token-detail">
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
          `$${detail.price_usd.toLocaleString()}`,
        )}
        {token_metadata_row_fun("REPUTATION", detail.reputation)}
        {token_metadata_row_fun("HOLDERS", detail.holders.toLocaleString())}
        {token_metadata_row_fun(
          "LIQUIDITY",
          `$${detail.liquidity_usd.toLocaleString()}`,
        )}
        {token_metadata_row_fun(
          "MARKET CAP",
          `$${detail.market_cap_usd.toLocaleString()}`,
        )}
        {token_metadata_row_fun("DECIMALS", String(detail.decimals))}
        {detail.main_pool !== null &&
          token_metadata_row_fun("MAIN POOL", detail.main_pool)}
        {detail.main_pool_url !== null && (
          <a
            class="huggies-token-main-pool-link"
            href={detail.main_pool_url}
            target="_blank"
            rel="noreferrer"
          >
            OPEN MAIN POOL
          </a>
        )}
      </section>
      {detail.id === HUGGIES_SHIT_TOKEN_ID && (
        <a
          class="huggies-token-special-link"
          href={`${"../".repeat(current_app_depth_fun())}shit-1170.html`}
        >
          OPEN THE $SHIT HOLDERS PAGE
        </a>
      )}
      {detail.description !== null && (
        <p class="huggies-token-description">{detail.description}</p>
      )}
      {Object.keys(detail.socials).length > 0 && (
        <section class="huggies-token-socials">
          {Object.entries(detail.socials).map(([name, url]) => (
            <a href={url} target="_blank" rel="noreferrer">
              {name.toUpperCase()}
            </a>
          ))}
        </section>
      )}
      <section class="huggies-token-holders">
        <h2>INDEXED HOLDERS ({holder_total.toLocaleString()})</h2>
        <div class="huggies-scroll">
          <table>
            <thead>
              <tr>
                <th class="huggies-holder-rank">#</th>
                <th class="huggies-holder-account">ACCOUNT</th>
                <th class="huggies-holder-unit">UNITS</th>
                <th class="huggies-holder-amount">BALANCE</th>
                <th class="huggies-holder-usd">USD</th>
              </tr>
            </thead>
            <tbody>
              {holders.map((holder, index) =>
                info === null ? (
                  <tr key={holder.account_id}>
                    <td class="huggies-holder-rank">{index + 1}</td>
                    <td class="huggies-holder-account">
                      <a
                        href={`${"../".repeat(current_app_depth_fun())}account.html?id=${encodeURIComponent(holder.account_id)}`}
                      >
                        {holder.account_id}
                      </a>
                    </td>
                    <td class="huggies-holder-unit">{holder.balance}</td>
                    <td class="huggies-holder-amount">—</td>
                    <td class="huggies-holder-usd">—</td>
                  </tr>
                ) : (
                  token_holder_row_fun({
                    key: holder.account_id,
                    rank: index + 1,
                    account_id: holder.account_id,
                    balance: holder.balance,
                    info,
                  })
                ),
              )}
            </tbody>
          </table>
        </div>
        {next_cursor !== null && (
          <button type="button" disabled={loading_more} onClick={load_more_fun}>
            {loading_more ? "LOADING..." : "LOAD MORE"}
          </button>
        )}
      </section>
      <section class="huggies-token-pools">
        <h2>POOLS ({pools.length})</h2>
        {pools.length === 0 ? (
          <p>NO POOLS FOUND</p>
        ) : (
          <>
            {[...new Set(pools.map((pool) => pool.dex))].map((dex) => {
              const first = pools.find((pool) => pool.dex === dex);
              return first === undefined ? null : pool_scope_fun(first);
            })}
            <ul>{pools.map((pool) => pool_row_fun(pool))}</ul>
          </>
        )}
      </section>
    </article>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TOKEN_DETAIL_PAGE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_TOKEN_DETAIL_PAGE_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
