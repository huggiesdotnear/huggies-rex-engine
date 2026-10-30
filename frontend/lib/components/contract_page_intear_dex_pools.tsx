// ========================================
// the intear dex page's pool list: the search box, the sort row and the
// pool rows.
//
// this component does NOT fetch. the intear dex page has one loader
// (lib/ts/contract_page_intear_dex.ts) and this component reads its
// result from the page store
// (lib/ts/contract_page_intear_dex_store.ts).
//
// the sort is ours: the dex api has no sort of its own, so the store
// orders the rows the api already sent. picking a sort costs no
// request.
//
// mounts into
// <div id="HUGGIES_COMPONENT_CONTRACT_INTEAR_DEX_POOLS">.
// ========================================
import { render } from "preact";
import { useMemo as use_memo, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_CONTRACT_PAGE_INTEAR_DEX_STORE } from "../ts/contract_page_intear_dex_store";
import { use_page_store_fun } from "../ts/use_page_store";
import { HUGGIES_INTEAR_DEX_POOL_SORTS } from "../ts/contract_page_intear_dex_pool_sort";
import { huggies_sort_keys_control_fun } from "./shared/sort_keys_control";
import type { HUGGIES_INTEAR_DEX_POOL } from "../ts/contract_page_intear_dex";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// render a usd figure with thousands separators and no decimals.
//
// --- WHY --- no decimals on a tvl or a volume: the number says how big
// the pool is, and $55,490 says that. the cents are noise.
function usd_fun(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${Math.round(value).toLocaleString()}`;
}
// ========================================
// ========================================
// --- ROW -------------------------------
// render one pool as a row.
//
// --- WHY --- the row is not a link: there is no pool detail page in
// this app yet, so a row that looks clickable and does nothing is
// worse than a row that plainly is not one.
function pool_row_fun(pool: HUGGIES_INTEAR_DEX_POOL): preact.JSX.Element {
  const symbols = pool.symbols.join(" / ");
  return (
    <div class="pool">
      <span class="pool-pair">
        <strong>{symbols.length > 0 ? symbols : pool.id}</strong>
        <span class="pool-kind">{pool.kind}</span>
      </span>
      <span class="pool-values">
        <span>{usd_fun(pool.tvl_usd)} TVL</span>
        <span>{usd_fun(pool.volume_24h_usd)} VOL</span>
        <span>{pool.apy.toFixed(2)}% APY</span>
      </span>
    </div>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_INTEAR_DEX_POOLS_FUN() {
  const [query, set_query] = use_state("");

  const page_data = use_page_store_fun(HUGGIES_CONTRACT_PAGE_INTEAR_DEX_STORE);

  // the sort and the direction live in the store, so the header and the
  // list always agree on the order.
  const sort = HUGGIES_CONTRACT_PAGE_INTEAR_DEX_STORE.get_sort();
  const direction = HUGGIES_CONTRACT_PAGE_INTEAR_DEX_STORE.get_direction();
  const loading = HUGGIES_CONTRACT_PAGE_INTEAR_DEX_STORE.is_loading();
  const errors = page_data?.errors ?? [];

  // --- WHY --- the search filters the loaded pools and not the api.
  // the dex api has no search endpoint and answers with every pool in
  // one go — all 303 of them are already on screen — so there is
  // nothing to ask it for. the filter runs over the rows we have.
  const pools = use_memo(() => {
    const all = HUGGIES_CONTRACT_PAGE_INTEAR_DEX_STORE.get_pools();
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return all;
    return all.filter((pool) => {
      if (pool.symbols.join(" ").toLowerCase().includes(needle)) return true;
      if (pool.token_ids.join(" ").toLowerCase().includes(needle)) return true;
      return String(pool.id) === needle;
    });
  }, [query, page_data, sort, direction]);

  return (
    <section>
      <div class="controls">
        <div class="search">
          <input
            type="search"
            value={query}
            placeholder="token symbol or id"
            onInput={(event) => {
              set_query((event.currentTarget as HTMLInputElement).value);
            }}
          />
        </div>
        <div class="sort">
          {huggies_sort_keys_control_fun({
            options: HUGGIES_INTEAR_DEX_POOL_SORTS,
            sort,
            direction,
            on_sort: (next) => {
              HUGGIES_CONTRACT_PAGE_INTEAR_DEX_STORE.set_sort(next);
            },
            on_direction: (next) => {
              HUGGIES_CONTRACT_PAGE_INTEAR_DEX_STORE.set_direction(next);
            },
          })}
        </div>
      </div>
      {errors.map((message) => (
        <p class="error">{message}</p>
      ))}
      <div class="results-scroll">
        {pools.length === 0 && !loading ? (
          <p>NO POOLS FOUND</p>
        ) : (
          <div class="results">{pools.map((pool) => pool_row_fun(pool))}</div>
        )}
        {loading && <p class="loading">LOADING POOLS...</p>}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_INTEAR_DEX_POOLS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_INTEAR_DEX_POOLS_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
