// ========================================
// the swap page's route cards: one card per dex that can serve the
// swap, best first.
//
// the reader picks the route they want to trade on, and the card they
// picked shows the amount that lands in the swap form's output box.
//
// --- WHY THE CARDS ARE A LIST AND NOT A DROPDOWN: the routes differ
// by a few hundredths of a percent, and that difference is the whole
// point of a route picker. a dropdown hides the comparison the reader
// is making.
//
// mounts into <div id="HUGGIES_COMPONENT_SWAP_ROUTES">.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/shared/mount_ids";
import { HUGGIES_APP_PAGE_SWAP_STORE } from "../ts/swap/app_page_swap_store";
import { use_page_store_fun } from "../ts/shared/use_page_store";
import { unit_to_human_fun } from "../ts/swap/app_page_swap_amount";
import type { HUGGIES_SWAP_ROUTE } from "../ts/swap/app_page_swap_routes";
// ========================================
// ========================================
// --- CARD ------------------------------
// one route card: the dex, the amount out, the worst case, the number
// of transactions.
//
// --- WHY THE WORST CASE IS ON THE CARD: a quote is a promise about a
// number that moves. the worst case is the floor the router will hold
// to, and a reader choosing between routes wants to see it — a route
// that pays more but can pay much less is not the better route.
function route_card_fun(
  route: HUGGIES_SWAP_ROUTE,
  decimals: number,
  symbol: string,
  is_best: boolean,
  is_selected: boolean,
): preact.JSX.Element {
  const classes = ["swap-route"];
  if (is_best) classes.push("is-best");
  if (is_selected) classes.push("is-selected");
  return (
    <button
      type="button"
      class={classes.join(" ")}
      onClick={() => {
        HUGGIES_APP_PAGE_SWAP_STORE.select_route(route.dex_id);
      }}
      title={`trade on ${route.dex_id}`}
    >
      <span class="swap-route-head">
        <strong>{route.dex_id}</strong>
        {is_best && <span class="swap-route-badge">BEST</span>}
      </span>
      <span class="swap-route-amount">
        {unit_to_human_fun(route.amount_out, decimals)} {symbol}
      </span>
      <span class="swap-route-detail">
        <span>
          MIN {unit_to_human_fun(route.worst_case_out, decimals)} {symbol}
        </span>
        <span>
          {route.tx_count} TX
        </span>
      </span>
    </button>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_SWAP_ROUTES_FUN() {
  const page = use_page_store_fun(HUGGIES_APP_PAGE_SWAP_STORE);

  const out_info = page.token_out_info;
  const decimals = out_info?.decimals ?? 0;
  const symbol = out_info?.symbol ?? page.token_out;
  const selected = HUGGIES_APP_PAGE_SWAP_STORE.get_selected_route();

  if (page.loading_routes && page.routes.length === 0) {
    return (
      <section class="swap-routes">
        <p class="swap-routes-note">FINDING ROUTES...</p>
      </section>
    );
  }

  if (page.routes.length === 0) {
    return (
      <section class="swap-routes">
        <p class="swap-routes-note">
          {page.error !== null
            ? page.error
            : "NO ROUTE FOR THIS PAIR — TRY ANOTHER AMOUNT OR ANOTHER TOKEN"}
        </p>
      </section>
    );
  }

  return (
    <section class="swap-routes">
      <p class="swap-routes-note">
        {page.routes.length} ROUTE{page.routes.length === 1 ? "" : "S"}
        {selected !== null ? ` · ${selected.dex_id}` : ""}
      </p>
      <div class="swap-route-list">
        {page.routes.map((route, index) =>
          route_card_fun(
            route,
            decimals,
            symbol,
            index === 0,
            selected !== null && selected.dex_id === route.dex_id,
          ),
        )}
      </div>
      {selected !== null && (
        <p class="swap-routes-note">
          YOU GET {unit_to_human_fun(selected.amount_out, decimals)} {symbol}
        </p>
      )}
    </section>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_SWAP_ROUTES;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_SWAP_ROUTES_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
