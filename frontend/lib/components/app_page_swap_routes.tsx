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
import { HUGGIES_AMOUNT_FORMAT } from "../ts/shared/token_amount_format";
import { human_to_unit_fun } from "../ts/swap/app_page_swap_amount";
import type { HUGGIES_SWAP_ROUTE } from "../ts/swap/app_page_swap_routes";
// ========================================
// ========================================
// --- CARD ------------------------------
// one route card: the dex, the amount, the worst case, the number of
// transactions.
//
// --- WHY --- THE WORST CASE IS ON THE CARD: a quote is a promise about
// a number that moves. the worst case is the floor the router will hold
// to, and a reader choosing between routes wants to see it — a route
// that pays more but can pay much less is not the better route.
//
// --- WHY --- THE CARD READS THE SIDE THE READER IS FIXING: the card's
// job is to let the reader COMPARE the routes, and the number worth
// comparing is the one they asked about. when they fixed the output,
// the router answers with the amount IN, so the card shows what the
// swap costs. showing the amount out there would read "0.00", because
// the router does not answer an amount out question with an amount
// out.
//
// --- WHY --- THE GUARANTEED OUTPUT IS ON THE CARD TOO: when the reader
// fixes the output, every route pays the SAME output — that is what
// "I want this much out" means — so the only thing that differs
// between the cards is the cost. but the reader still wants to see what
// they are getting, so the card names it, and the line under it says
// what it costs.
function route_card_fun(
  route: HUGGIES_SWAP_ROUTE,
  amount: string,
  worst_case: string,
  decimals: number,
  symbol: string,
  is_best: boolean,
  is_selected: boolean,
  guaranteed_out_unit: string | null,
  out_decimals: number,
  out_symbol: string,
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
        {HUGGIES_AMOUNT_FORMAT.balance(amount, { decimals })}{" "}
        {symbol}
      </span>
      {guaranteed_out_unit !== null && (
        <span class="swap-route-get">
          GET {HUGGIES_AMOUNT_FORMAT.balance(guaranteed_out_unit, {
            decimals: out_decimals,
          })}{" "}
          {out_symbol}
        </span>
      )}
      <span class="swap-route-detail">
        <span>
          MIN {HUGGIES_AMOUNT_FORMAT.balance(worst_case, { decimals })}{" "}
          {symbol}
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
export function HUGGIES_COMPONENT_SWAP_ROUTES_FUN() {
  const page = use_page_store_fun(HUGGIES_APP_PAGE_SWAP_STORE);

  const out_info = page.token_out_info;
  const in_info = page.token_in_info;
  const selected = HUGGIES_APP_PAGE_SWAP_STORE.get_selected_route();

  // --- WHY --- THE CARDS READ THE SIDE THE READER IS FIXING: when they
  // fix the output, the router answers with the amount IN, so the card
  // shows what the swap COSTS. reading the output amount there would
  // read "0.00", because the router does not answer an amount out
  // question with an amount out.
  const fixed_out = page.amount_side === "out";
  // the token the number on the card is in.
  const card_symbol = fixed_out
    ? (in_info?.symbol ?? page.token_in)
    : (out_info?.symbol ?? page.token_out);
  const card_decimals = fixed_out
    ? (in_info?.decimals ?? 0)
    : (out_info?.decimals ?? 0);
  // the number on the card, and its floor.
  const card_amount = (route: HUGGIES_SWAP_ROUTE): string =>
    fixed_out ? route.amount_in : route.amount_out;
  const card_worst_case = (route: HUGGIES_SWAP_ROUTE): string =>
    fixed_out ? route.worst_case_in : route.worst_case_out;

  // --- WHY --- THE SUMMARY READS THE SIDE THE READER IS FIXING: when
  // they fix the output, the number they care about is what it COSTS,
  // and the router answers that question with the input amount. the
  // line would otherwise name a number the reader is not waiting for.
  const summary_symbol = card_symbol;
  const summary_decimals = card_decimals;
  const summary_amount = selected === null
    ? null
    : card_amount(selected);
  const summary_word = fixed_out ? "YOU PAY" : "YOU GET";

  // --- WHY --- THE GUARANTEED OUTPUT IS THE READER'S OWN NUMBER: when
  // they fix the output, the router does NOT answer with an amount
  // out — it answers with the cost, and guarantees the output the
  // reader asked for by buying enough to cover the slippage. so the
  // output is the number the reader typed, and every route pays it.
  //
  // --- WHY --- IT IS CONVERTED TO THE UNIT AMOUNT: the display
  // formatter takes the smallest unit, and the reader's number is a
  // human one. handing "1" to the formatter as if it were a unit
  // amount would read it as a fraction of a token.
  const guaranteed_out_decimal = out_info?.decimals ?? 0;
  const guaranteed_out_unit =
    fixed_out && page.amount_out.trim().length > 0
      ? human_to_unit_fun(page.amount_out, guaranteed_out_decimal)
      : null;
  const guaranteed_out_decimals = guaranteed_out_decimal;
  const guaranteed_out_symbol = out_info?.symbol ?? page.token_out;

  if (page.loading_routes && page.routes.length === 0) {
    return (
      <section class="swap-routes">
        <p class="swap-routes-note">FINDING ROUTES...</p>
      </section>
    );
  }

  if (page.routes.length === 0) {
    // --- WHY --- NO ROUTE MESSAGE BEFORE AN AMOUNT IS ENTERED: the
    // reader has not asked for a quote yet, so there is nothing to be
    // found and nothing to explain. the empty state asks them for the
    // amount that starts the search.
    const fixed_human =
      page.amount_side === "in" ? page.amount_in : page.amount_out;
    const has_amount = fixed_human.trim().length > 0;
    return (
      <section class="swap-routes">
        <p class="swap-routes-note">
          {page.error !== null
            ? page.error
            : has_amount
              ? "NO ROUTE FOR THIS PAIR — TRY ANOTHER AMOUNT OR ANOTHER TOKEN"
              : "ENTER AN AMOUNT TO GET A ROUTE"}
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
            card_amount(route),
            card_worst_case(route),
            card_decimals,
            card_symbol,
            index === 0,
            selected !== null && selected.dex_id === route.dex_id,
            guaranteed_out_unit,
            guaranteed_out_decimals,
            guaranteed_out_symbol,
          ),
        )}
      </div>
      {selected !== null && summary_amount !== null && (
        <p class="swap-routes-note">
          {summary_word}{" "}
          {HUGGIES_AMOUNT_FORMAT.balance(summary_amount, {
            decimals: summary_decimals,
          })}{" "}
          {summary_symbol}
          {guaranteed_out_unit !== null && (
            <>
              {" · GET "}
              {HUGGIES_AMOUNT_FORMAT.balance(guaranteed_out_unit, {
                decimals: guaranteed_out_decimals,
              })}{" "}
              {guaranteed_out_symbol}
            </>
          )}
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
