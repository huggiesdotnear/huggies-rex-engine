// ========================================
// the LIVE QUOTE of a queued swap.
//
// a queued swap is the token in, the amount in and the token out. the
// amount OUT is not known until somebody asks the router, and the router
// answers differently every block — so the feed asks it again, every
// time it loads, and shows the best route's amount out.
//
// --- WHY IT IS SHARED AND NOT IN THE FEED'S FOLDER: the feed page asks
// for the quote of every queued swap on screen, and the swap page asks
// for the quote of the swap it is showing. two pages, one question, one
// answer — and they must not drift on it.
//
// --- WHY THE ROUTER IS ASKED AND NOT THE BACKEND: the backend stores
// the quote that was taken when the swap was queued, and that quote is
// for a pool state that is gone. the live quote comes from the router,
// which is the thing that knows the pools right now.
//
// --- WHY A FAILURE IS NOT FATAL: the router can be down, and a feed of
// swaps with no numbers in them is useless. so a failure is answered
// with null, and the caller falls back to the stored quote.
//
// --- WHY THE QUOTE CARRIES THE ROUTE AND NOT JUST THE NUMBERS: the
// route IS the quote — the numbers are read off it. a card that shows
// an amount out and cannot be signed from is half a quote. so the route
// rides along, and the card's SWAP NOW signs exactly the route the
// reader can see.
import { SHIT_1170_SWAP_AGGREGATOR } from "../swap/app_page_swap_aggregator";
import { router_token_id_fun } from "../swap/app_page_swap_router_token";
import {
  AMOUNT_IN,
  GET_ROUTES,
  type ROUTE,
} from "@sleet-js/intear-dex-aggregator-tool-box";
// ========================================
// --- TYPES ------------------------------
// what one live quote says.
export interface SHIT_1170_SWAP_QUOTE {
  // the token being sold.
  token_in: string;
  // the token being bought.
  token_out: string;
  // the raw amount in, in the input token's smallest unit.
  amount_in: string;
  // the BEST route's amount out, in the output token's smallest unit.
  // it is null when the router could not answer.
  amount_out: string | null;
  // the dex the best route came from. it is null when there is no
  // route.
  dex_id: string | null;
  // the best route's worst-case amount out, in the output token's
  // smallest unit. it is null when there is no route.
  worst_case_out: string | null;
  // the BEST route itself, or null when there is none.
  //
  // --- WHY --- IT RIDES ALONG: the card shows the best route's amount
  // out, and the SWAP NOW button signs the best route. if the button
  // had to ask the router again, the route it signed could be a
  // different one from the one on screen — and the number the reader
  // agreed to would not be the number they got.
  route: ROUTE | null;
}
// ========================================
// --- QUOTE ------------------------------
// the live quote for one swap, or null when the router could not answer.
//
// --- WHY THE BEST ROUTE IS THE ONE THAT IS ASKED FOR: the router
// answers best-first, and the feed shows the best route's amount out —
// the number a reader would actually get.
//
// --- WHY THE TRADER ACCOUNT IS LEFT OUT: the quote here is for the
// READER OF THE FEED, who may not be the one who executes it. the
// trader account is only needed for the router to plan the
// storage-deposit legs of a route that is about to be signed.
export async function shit_1170_swap_quote_fun(
  token_in: string,
  token_out: string,
  amount_in: string,
): Promise<SHIT_1170_SWAP_QUOTE | null> {
  const amount = amount_in.trim();
  if (amount.length === 0 || amount === "0") return null;
  try {
    const routes = await GET_ROUTES(
      SHIT_1170_SWAP_AGGREGATOR.client,
      AMOUNT_IN(
        router_token_id_fun(token_in),
        router_token_id_fun(token_out),
        amount,
      ),
    );
    const best = routes[0];
    if (best === undefined) {
      return {
        token_in,
        token_out,
        amount_in: amount,
        amount_out: null,
        dex_id: null,
        worst_case_out: null,
        route: null,
      };
    }
    const estimated = best.estimated_amount.amount_out;
    const worst = best.worst_case_amount.amount_out;
    return {
      token_in,
      token_out,
      amount_in: amount,
      amount_out:
        typeof estimated === "string" && estimated.length > 0
          ? estimated
          : null,
      dex_id: best.dex_id,
      worst_case_out:
        typeof worst === "string" && worst.length > 0 ? worst : null,
      route: best,
    };
  } catch (err) {
    // --- WHY --- THE FAILURE IS SWALLOWED AND NOT THROWN: the router is
    // a third party and it can be down. the feed shows the stored quote
    // instead, and the reader never sees a broken feed because a router
    // hiccuped.
    console.warn("[swap_quote] the router could not answer", err);
    return null;
  }
}
// ========================================
// copyright 2026 by sleet.near
