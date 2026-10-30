// ========================================
// the rhea page's pool list: the search box, the sort row, the pool
// family filter and the pool rows.
//
// this component does NOT fetch. the rhea page has one loader
// (lib/ts/contract_page_rhea.ts) and this component reads its result
// from the page store (lib/ts/contract_page_rhea_store.ts).
//
// the list is paged: the api sorts and paginates on its own, so the
// page asks for one page of rows at a time and asks for the next one
// when the reader scrolls to the bottom.
//
// mounts into
// <div id="HUGGIES_COMPONENT_CONTRACT_RHEA_POOLS">.
// ========================================
import { render } from "preact";
import {
  useEffect as use_effect,
  useRef as use_ref,
  useState as use_state,
} from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_CONTRACT_PAGE_RHEA_STORE } from "../ts/contract_page_rhea_store";
import { use_page_store_fun } from "../ts/use_page_store";
import {
  HUGGIES_DEFAULT_RHEA_POOL_SORT,
  HUGGIES_DEFAULT_RHEA_POOL_SORT_DIRECTION,
  HUGGIES_RHEA_POOL_SORTS,
  type HUGGIES_RHEA_POOL_SORT,
  type HUGGIES_RHEA_POOL_SORT_DIRECTION,
} from "../ts/contract_page_rhea_pool_sort";
import { huggies_sort_keys_control_fun } from "./shared/sort_keys_control";
import type { HUGGIES_RHEA_POOL } from "../ts/contract_page_rhea";
import type { RHEA_POOL_SEARCH_TYPE } from "@sleet-js/middleman-rhea-api";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how long to wait after a keystroke before asking the api. long
// enough that typing a word is one request, not one per letter.
const HUGGIES_SEARCH_DEBOUNCE_MS = 250;
// how close to the bottom of the list the reader has to scroll before
// the next page is asked for. a little early, so the next page is
// usually already there by the time they reach the end.
const HUGGIES_LOAD_MORE_THRESHOLD_PX = 600;
// the pool families the reader can pick between, with the labels they
// are offered under.
const HUGGIES_POOL_TYPE_OPTIONS: ReadonlyArray<{
  key: RHEA_POOL_SEARCH_TYPE;
  label: string;
}> = [
  { key: "all", label: "ALL" },
  { key: "classic", label: "AMM" },
  { key: "dcl", label: "DCL" },
];
// ========================================
// ========================================
// --- HELPERS ----------------------------
// render a usd figure with thousands separators and no decimals.
//
// --- WHY --- no decimals on a tvl or a volume: the number says how
// big the pool is, and $2,093,251 says that. the cents are noise.
function usd_fun(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${Math.round(value).toLocaleString()}`;
}
// ========================================
// ========================================
// --- ROW -------------------------------
// render one pool as a row.
//
// --- WHY --- the row is not a link: rhea has no pool detail page in
// this app yet, so a row that looks clickable and does nothing is
// worse than a row that plainly is not one.
function pool_row_fun(pool: HUGGIES_RHEA_POOL): preact.JSX.Element {
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
      {(pool.is_farm || pool.is_meme || pool.is_uncertified) && (
        <span class="pool-tags">
          {pool.is_farm && <span class="pool-tag">FARM</span>}
          {pool.is_meme && <span class="pool-tag">MEME</span>}
          {pool.is_uncertified && (
            <span class="pool-tag is-uncertified">UNCERTIFIED</span>
          )}
        </span>
      )}
    </div>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_RHEA_POOLS_FUN() {
  const [query, set_query] = use_state("");
  const [sort, set_sort] = use_state<HUGGIES_RHEA_POOL_SORT>(
    HUGGIES_DEFAULT_RHEA_POOL_SORT,
  );
  const [direction, set_direction] =
    use_state<HUGGIES_RHEA_POOL_SORT_DIRECTION>(
      HUGGIES_DEFAULT_RHEA_POOL_SORT_DIRECTION,
    );
  const [type, set_type] = use_state<RHEA_POOL_SEARCH_TYPE>("all");
  // the scroll container, so the reader's position at the bottom can
  // be detected.
  const scroll_ref = use_ref<HTMLDivElement | null>(null);

  const page_data = use_page_store_fun(HUGGIES_CONTRACT_PAGE_RHEA_STORE);

  // --- WHY --- the page's start script loads the list with the
  // default sort. this effect is for the reader's OWN choices: when
  // they pick a different sort or family, the list is loaded again
  // with it.
  use_effect(() => {
    void HUGGIES_CONTRACT_PAGE_RHEA_STORE.load(
      sort,
      direction === "desc",
      type,
      "",
    );
  }, [sort, direction, type]);

  // --- WHY --- a search asks the api, not the loaded page. the api
  // matches the token symbols and the token account ids, so a pool
  // outside the loaded page is still findable however the reader
  // typed. filtering a loaded list in javascript only sees the pools
  // we happened to load.
  //
  // --- WHY --- the wait: typing a word is one request, not one per
  // letter.
  use_effect(() => {
    const needle = query.trim();
    if (needle.length === 0) return;
    const timer = window.setTimeout(() => {
      void HUGGIES_CONTRACT_PAGE_RHEA_STORE.load(
        sort,
        direction === "desc",
        type,
        needle,
      );
    }, HUGGIES_SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query, sort, direction, type]);

  const loading = HUGGIES_CONTRACT_PAGE_RHEA_STORE.is_loading();
  const pools = page_data?.pools ?? [];
  const has_more = page_data?.has_more ?? false;
  const errors = page_data?.errors ?? [];
  const searching = query.trim().length > 0;

  // --- WHY --- the next page is asked for when the reader nears the
  // bottom of the list, not when they reach it exactly: the request
  // takes a moment, and asking early means the rows are usually
  // already there by the time they scroll to them.
  use_effect(() => {
    if (!has_more || loading) return;
    const element = scroll_ref.current;
    if (element === null) return;
    const on_scroll_fun = (): void => {
      const distance =
        element.scrollHeight - element.scrollTop - element.clientHeight;
      if (distance > HUGGIES_LOAD_MORE_THRESHOLD_PX) return;
      void HUGGIES_CONTRACT_PAGE_RHEA_STORE.load_more();
    };
    element.addEventListener("scroll", on_scroll_fun);
    return () => {
      element.removeEventListener("scroll", on_scroll_fun);
    };
  }, [has_more, loading, sort, direction, type, query]);

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
        <div class="types">
          {HUGGIES_POOL_TYPE_OPTIONS.map((option) => (
            <button
              type="button"
              class={
                option.key === type ? "type-button is-active" : "type-button"
              }
              aria-pressed={option.key === type}
              onClick={() => set_type(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div class="sort">
          {huggies_sort_keys_control_fun({
            options: HUGGIES_RHEA_POOL_SORTS,
            sort,
            direction,
            on_sort: (next) => set_sort(next),
            on_direction: (next) => set_direction(next),
          })}
        </div>
      </div>
      {errors.map((message) => (
        <p class="error">{message}</p>
      ))}
      <div class="results-scroll" ref={scroll_ref}>
        {pools.length === 0 && !loading ? (
          <p>{searching ? "NO POOLS FOUND" : "NO POOLS"}</p>
        ) : (
          <div class="results">{pools.map((pool) => pool_row_fun(pool))}</div>
        )}
        {loading && <p class="loading">LOADING POOLS...</p>}
        {!loading && has_more && <p class="loading">SCROLL FOR MORE...</p>}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_RHEA_POOLS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_RHEA_POOLS_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
