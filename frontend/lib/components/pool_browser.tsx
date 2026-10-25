// ========================================
// the shared pool browser used by every dex contract page.
// ========================================
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_TOKEN_INFO } from "../ts/token_info";
import { HUGGIES_AMOUNT_FORMAT } from "../ts/token_amount_format";
import { token_detail_href_fun } from "../ts/token_link";
import { current_app_depth_fun } from "../ts/app_depth";
import type { HUGGIES_TOKEN_INFO as TOKEN_INFO } from "../ts/token_info";
// ========================================
export interface HUGGIES_POOL_BROWSE_POOL {
  pool_id: string;
  label: string;
  token_ids: string[];
  amounts: string[];
}
// ========================================
// the tokens a pool filter can single out, by the part of their id
// that identifies them. the filter is a row of buttons rather than a
// dropdown: a dex has thousands of tokens, and a dropdown that long
// cannot be scanned.
const HUGGIES_POOL_FILTER_TAGS: ReadonlyArray<{
  label: string;
  match: (token_id: string) => boolean;
}> = [
  { label: "ALL", match: () => true },
  { label: "BTC", match: (id) => id.includes("nbtc") },
  { label: "ZEC", match: (id) => id.includes("zec") },
  { label: "SOL", match: (id) => id.includes("sol") },
  { label: "NEAR", match: (id) => id === "near" || id === "wrap.near" },
  { label: "USDC", match: (id) => id.includes("usdc") },
  { label: "USDT", match: (id) => id.includes("usdt") },
];
// ========================================
// render one pool card with its token symbols and readable reserves.
function pool_card_fun(
  pool: HUGGIES_POOL_BROWSE_POOL,
  info_map: Map<string, TOKEN_INFO>,
  external_url: string | null,
): preact.JSX.Element {
  return (
    <article class="huggies-pool-card">
      <header class="huggies-pool-card-head">
        <span class="huggies-pool-card-id">{pool.label}</span>
        <code class="huggies-pool-card-num">#{pool.pool_id}</code>
      </header>
      <div class="huggies-pool-card-tokens">
        {pool.token_ids.map((token_id, index) => {
          const info = info_map.get(token_id);
          const raw = pool.amounts[index] ?? "0";
          const human =
            info === undefined
              ? raw
              : HUGGIES_AMOUNT_FORMAT.balance(raw, info);
          return (
            <div class="huggies-pool-card-token">
              <a href={token_detail_href_fun(token_id, current_app_depth_fun())}>
                {info?.symbol ?? token_id}
              </a>
              <span class="huggies-pool-card-amount">{human}</span>
              <code class="huggies-pool-card-id-full">{token_id}</code>
            </div>
          );
        })}
      </div>
      {external_url !== null && (
        <a
          class="huggies-pool-card-link"
          href={external_url}
          target="_blank"
          rel="noreferrer"
        >
          VIEW POOL
        </a>
      )}
    </article>
  );
}
// ========================================
// render the searchable pool browser shared by the dex pages.
export function huggies_pool_browser_fun(props: {
  pools: ReadonlyArray<HUGGIES_POOL_BROWSE_POOL>;
  total_pools: number;
  unique_tokens: number;
  external_url?: (pool_id: string) => string | null;
  empty_text?: string;
}): preact.JSX.Element {
  const [query, set_query] = use_state("");
  const [filter, set_filter] = use_state(0);
  const [info_map, set_info_map] = use_state<Map<string, TOKEN_INFO>>(new Map());

  const token_ids = [...new Set(props.pools.flatMap((pool) => pool.token_ids))];

  use_effect(() => {
    let cancelled = false;
    void HUGGIES_TOKEN_INFO.get(token_ids)
      .then((map) => {
        if (!cancelled) set_info_map(map);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [props.pools]);

  const needle = query.trim().toLowerCase();
  const tag = HUGGIES_POOL_FILTER_TAGS[filter] ?? HUGGIES_POOL_FILTER_TAGS[0];
  const filtered = props.pools.filter((pool) => {
    if (!pool.token_ids.some((id) => tag.match(id))) return false;
    if (needle.length === 0) return true;
    return pool.token_ids.some((id) => id.toLowerCase().includes(needle));
  });

  return (
    <>
      <section class="huggies-pool-stats">
        <article class="huggies-pool-stat">
          <span class="huggies-pool-stat-value">
            {props.total_pools.toLocaleString()}
          </span>
          <span class="huggies-pool-stat-label">TOTAL POOLS</span>
        </article>
        <article class="huggies-pool-stat">
          <span class="huggies-pool-stat-value">
            {props.unique_tokens.toLocaleString()}
          </span>
          <span class="huggies-pool-stat-label">UNIQUE TOKENS</span>
        </article>
      </section>
      <section class="huggies-pool-controls">
        <label class="huggies-pool-search">
          <span>SEARCH TOKEN</span>
          <input
            type="search"
            value={query}
            placeholder="token account id"
            onInput={(event) => {
              set_query((event.currentTarget as HTMLInputElement).value);
            }}
          />
        </label>
        <div class="huggies-pool-filters" role="group" aria-label="filter pools">
          {HUGGIES_POOL_FILTER_TAGS.map((option, index) => (
            <button
              type="button"
              class={
                index === filter
                  ? "huggies-pool-filter is-active"
                  : "huggies-pool-filter"
              }
              aria-pressed={index === filter}
              onClick={() => set_filter(index)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
      <p class="huggies-pool-count">
        SHOWING {filtered.length.toLocaleString()} OF{" "}
        {props.pools.length.toLocaleString()} POOLS
      </p>
      {filtered.length === 0 ? (
        <p>{props.empty_text ?? "NO POOLS MATCH THIS FILTER."}</p>
      ) : (
        <div class="huggies-pool-grid">
          {filtered.map((pool) =>
            pool_card_fun(
              pool,
              info_map,
              props.external_url?.(pool.pool_id) ?? null,
            ),
          )}
        </div>
      )}
    </>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
