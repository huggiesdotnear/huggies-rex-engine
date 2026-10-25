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
import { token_detail_href_fun } from "../ts/token_link";
import { current_app_depth_fun } from "../ts/app_depth";
import { HUGGIES_TOKEN_INFO } from "../ts/token_info";
import { HUGGIES_AMOUNT_FORMAT } from "../ts/token_amount_format";
import { format_price_usd_fun } from "../ts/token_price_format";
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
// render one pool card.
function pool_row_fun(
  pool: HUGGIES_POOL,
  info_map: Map<string, HUGGIES_TOKEN_INFO>,
): preact.JSX.Element {
  return (
    <li class="huggies-token-pool-card">
      <header>
        <strong>{pool.dex_name}</strong>
        <span>POOL {pool.pool_id}</span>
      </header>
      <div class="huggies-token-pool-tokens">
        {pool.token_ids.map((token_id, index) => {
          const token_info = info_map.get(token_id);
          const raw = pool.amounts[index] ?? "0";
          const human =
            token_info === undefined
              ? raw
              : HUGGIES_AMOUNT_FORMAT.balance(raw, token_info);
          return (
            <div class="huggies-token-pool-token">
              <a href={token_detail_href_fun(token_id, current_app_depth_fun())}>
                {token_info?.symbol ?? token_id}
              </a>
              <span title={token_id}>{human}</span>
            </div>
          );
        })}
      </div>
      {pool.dex === "rhea_amm" && (
        <a
          class="huggies-token-pool-link"
          href={`https://app.rhea.finance/pool/${pool.pool_id}`}
          target="_blank"
          rel="noreferrer"
        >
          VIEW ON RHEA
        </a>
      )}
    </li>
  );
}
// ========================================
// token detail page component.
function HUGGIES_COMPONENT_TOKEN_DETAIL_PAGE_FUN() {
  const token_id = token_id_from_url_fun();
  const [input_id, set_input_id] = use_state<string>(token_id ?? "");
  const [detail, set_detail] = use_state<HUGGIES_TOKEN_DETAIL | null>(null);
  const [holders, set_holders] = use_state<HUGGIES_TOKEN_HOLDER[]>([]);
  const [holder_total, set_holder_total] = use_state(0);
  const [next_cursor, set_next_cursor] = use_state<string | null>(null);
  const [pools, set_pools] = use_state<HUGGIES_POOL[]>([]);
  const [loading_more, set_loading_more] = use_state(false);
  const [error, set_error] = use_state<string | null>(null);
  const [info, set_info] = use_state<HUGGIES_TOKEN_INFO | null>(null);
  const [pool_info, set_pool_info] = use_state<Map<string, HUGGIES_TOKEN_INFO>>(
    new Map(),
  );

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
        // every token that appears in one of the token's pools, so the
        // pool cards can show symbols and human-readable reserves.
        const pool_token_ids = [
          ...new Set(token_pools.flatMap((pool) => pool.token_ids)),
        ];
        void HUGGIES_TOKEN_INFO.get(pool_token_ids)
          .then((pool_map) => {
            if (!cancelled) set_pool_info(pool_map);
          })
          .catch(() => undefined);
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

  const open_token_fun = () => {
    const next_id = input_id.trim();
    if (next_id.length === 0) return;
    const url = new URL(window.location.href);
    url.searchParams.set("id", next_id);
    window.location.href = url.toString();
  };

  return (
    <article class="huggies-token-detail">
      <section class="huggies-token-search-card">
        <label>
          <span>TOKEN ACCOUNT ID</span>
          <input
            type="text"
            value={input_id}
            placeholder="token.near"
            onInput={(event) => {
              set_input_id((event.currentTarget as HTMLInputElement).value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") open_token_fun();
            }}
          />
        </label>
        <button type="button" onClick={open_token_fun}>
          OPEN TOKEN
        </button>
      </section>
      {token_id === null ? (
        <p>TOKEN ID MISSING</p>
      ) : error !== null ? (
        <p>{error}</p>
      ) : detail === null ? (
        <p>LOADING TOKEN...</p>
      ) : (
        <>
          <header class="huggies-token-detail-header">
            {detail.icon !== null && (
              <img
                class="huggies-token-detail-icon"
                src={detail.icon}
                alt=""
              />
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
            {token_metadata_row_fun(
              "HOLDERS",
              detail.holders.toLocaleString(),
            )}
            {token_metadata_row_fun(
              "LIQUIDITY",
              format_price_usd_fun(detail.liquidity_usd),
            )}
            {token_metadata_row_fun(
              "MARKET CAP",
              format_price_usd_fun(detail.market_cap_usd),
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
            <section class="huggies-token-description-card">
              <h2>ABOUT THIS TOKEN</h2>
              <p class="huggies-token-description">{detail.description}</p>
            </section>
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
              <button
                type="button"
                disabled={loading_more}
                onClick={load_more_fun}
              >
                {loading_more ? "LOADING..." : "LOAD MORE"}
              </button>
            )}
          </section>
          <section class="huggies-token-pools">
            <h2>POOLS ({pools.length})</h2>
            {pools.length === 0 ? (
              <p>NO POOLS FOUND</p>
            ) : (
              <ul>
                {pools.map((pool) => pool_row_fun(pool, pool_info))}
              </ul>
            )}
          </section>
        </>
      )}
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
