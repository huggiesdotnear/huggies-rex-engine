// ========================================
// the feed page's SWAP SEND: sign a queued swap and report it.
//
// the feed's SWAP NOW button does what the swap page's SWAP button
// does: it works out the route, hands it to the wallet and records
// what came of it against the queued swap.
//
// --- WHY THE ROUTE IS TAKEN HERE AND NOT FROM THE FEED'S QUOTE: the
// feed's quote is a READ — it asks the router what the swap is worth
// so the card can show a number. it carries no trader account and it
// holds no route. the send needs the real route, planned for the
// account that is going to sign it, because the storage-deposit legs
// depend on who is trading. so the send asks the router again, with
// the reader's account, and uses the route that answer gives.
//
// --- WHY THE ROUTE IS TAKEN AGAIN AT SEND TIME: the pools move every
// block, and the card's quote was taken when the feed loaded. a route
// that is minutes old can be stale, and a stale route is a route the
// dex may refuse. so the send asks for a fresh one.
//
// --- WHY THE RESULT IS REPORTED AND NOT LEFT TO THE FEED'S REFRESH:
// the backend's record of the send is the account row's hash and
// status. without the report the swap would go out on the chain and
// the feed would still say WAITING.
import {
  AMOUNT_IN,
  GET_ROUTES,
  type ROUTE,
} from "@sleet-js/intear-dex-aggregator-tool-box";
import {
  api_shit_1170_swap_queue_sent_post,
  type SHIT_1170_SWAP_QUEUE,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_SWAP_AGGREGATOR } from "../swap/app_page_swap_aggregator";
import { SHIT_1170_APP_PAGE_SWAP_EXECUTE } from "../swap/app_page_swap_execute";
import { router_token_id_fun } from "../swap/app_page_swap_router_token";
import { SHIT_1170_BASE_URL } from "../shared/base_url";
import { api_key_options_fun } from "../shared/api_key_token";
import { SHIT_1170_AUTH } from "../shared/auth_status";
import { SHIT_1170_TOAST_STORE } from "../shared/toast_store";
import { SHIT_1170_APP_PAGE_FEED_STORE } from "./app_page_feed_store";
// ========================================
// --- TYPES ------------------------------
// what came of a queued swap's send.
export interface SHIT_1170_SWAP_SEND_RESULT {
  // true when the swap went through.
  succeeded: boolean;
  // the hash of the first transaction that was sent, for the link to
  // the transaction page. null when nothing went out.
  tx_hash: string | null;
  // the amount that came out, in the output token's smallest unit.
  amount_out: string | null;
  // the message for the reader, when it failed.
  error: string | null;
  // true when the reader DECLINED the wallet popup.
  declined: boolean;
  // true when the swap may well have gone through but we could not
  // tell — the outcome CHECK failed, not the swap.
  unknown: boolean;
}
// ========================================
// --- ROUTE -----------------------------
// the live route for one queued swap, planned for the reader's account.
//
// --- WHY THE TRADER ACCOUNT GOES WITH IT: the router needs to know
// WHO is trading so it can plan the storage-deposit legs the swap
// needs. without it the route it answers may be missing a deposit the
// reader's account does not yet have, and the swap cannot go out.
//
// --- WHY NULL AND NOT AN ERROR: no dex serving this pair is not a
// broken app — it is a trade nobody can make right now. the caller
// shows the reader why and stops.
async function swap_route_fun(
  swap: SHIT_1170_SWAP_QUEUE,
  account_id: string,
): Promise<ROUTE | null> {
  const amount = swap.amountIn.trim();
  if (amount.length === 0 || amount === "0") return null;
  const routes = await GET_ROUTES(
    SHIT_1170_SWAP_AGGREGATOR.client,
    {
      ...AMOUNT_IN(
        router_token_id_fun(swap.tokenIn),
        router_token_id_fun(swap.tokenOut),
        amount,
      ),
      trader_account_id: account_id,
    },
  );
  return routes[0] ?? null;
}
// ========================================
// --- REPORT ----------------------------
// record the send against the queued swap.
//
// --- WHY THE ACCOUNT IS NOT SENT: the api key IS the account. the
// backend reads the account from the key and writes the hash on that
// account's own row.
//
// --- WHY A FAILED REPORT IS SWALLOWED: the swap DID go out. the
// report is the backend's record of it, and a backend that cannot be
// reached must not turn a working swap into a failure in the reader's
// eyes. the hash is still linked in the toast.
async function report_swap_fun(
  swap: SHIT_1170_SWAP_QUEUE,
  tx_hash: string,
  status: "succeeded" | "failed" | "sent",
  amount_out: string | null,
): Promise<void> {
  try {
    const options = await api_key_options_fun(true);
    await api_shit_1170_swap_queue_sent_post(
      SHIT_1170_BASE_URL,
      swap.swapId,
      {
        txHash: tx_hash,
        status,
        amountOut: amount_out ?? undefined,
      },
      options,
    );
  } catch (err) {
    console.warn("[app_page_feed_swap_send] the swap could not be reported", err);
  }
}
// ========================================
// --- SEND ------------------------------
// sign the queued swap from the reader's account and report it.
//
// --- WHY THE READER'S OWN ACCOUNT IS THE ONE THAT SIGNS: a queued
// swap is an open offer, and the reader who presses SWAP NOW is
// trading with their own wallet. the swap was named for somebody, but
// the wallet that signs is the one that is open in the browser.
//
// --- WHY A MISSING ROUTE IS REFUSED BEFORE THE WALLET OPENS: there is
// nothing to sign without a route, and asking the reader to approve a
// popup that has nothing behind it is worse than saying no dex can
// serve the pair.
export async function shit_1170_feed_send_swap_fun(
  swap: SHIT_1170_SWAP_QUEUE,
): Promise<SHIT_1170_SWAP_SEND_RESULT> {
  const account_id = SHIT_1170_AUTH.get_account_id();
  if (account_id === null) {
    return {
      succeeded: false,
      tx_hash: null,
      amount_out: null,
      error: "SIGN IN TO SWAP",
      declined: false,
      unknown: false,
    };
  }

  let route: ROUTE | null;
  try {
    route = await swap_route_fun(swap, account_id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    SHIT_1170_TOAST_STORE.show("error", "SWAP FAILED", message, null);
    return {
      succeeded: false,
      tx_hash: null,
      amount_out: null,
      error: message,
      declined: false,
      unknown: false,
    };
  }
  if (route === null) {
    const message = "NO DEX CAN SERVE THIS PAIR RIGHT NOW";
    SHIT_1170_TOAST_STORE.show("error", "SWAP FAILED", message, null);
    return {
      succeeded: false,
      tx_hash: null,
      amount_out: null,
      error: message,
      declined: false,
      unknown: false,
    };
  }

  const result = await SHIT_1170_APP_PAGE_SWAP_EXECUTE.execute(
    route,
    swap.tokenIn,
    swap.tokenOut,
    account_id,
  );

  // --- WHY THE REPORT IS MADE BEFORE THE TOAST: the report is what
  // puts the swap's hash and its outcome on the feed, and the reader is
  // about to be told the swap went out. so the record is made first.
  if (result.tx_hash !== null) {
    const status = result.succeeded
      ? "succeeded"
      : result.unknown
        ? "sent"
        : "failed";
    await report_swap_fun(swap, result.tx_hash, status, result.amount_out);
  }

  // --- WHY A DECLINE IS NOT A TOAST: the reader said no, and that is
  // not a failure. the button just goes back to saying SWAP NOW.
  if (result.declined) {
    return {
      succeeded: false,
      tx_hash: null,
      amount_out: null,
      error: null,
      declined: true,
      unknown: false,
    };
  }

  if (result.succeeded) {
    SHIT_1170_TOAST_STORE.show(
      "success",
      "SWAP DONE",
      result.amount_out === null ? null : result.amount_out,
      result.tx_hash,
    );
  } else if (result.unknown) {
    SHIT_1170_TOAST_STORE.show(
      "info",
      "SWAP SENT — CHECK IT",
      result.error,
      result.tx_hash,
    );
  } else {
    SHIT_1170_TOAST_STORE.show(
      "error",
      "SWAP FAILED",
      result.error,
      result.tx_hash,
    );
  }

  return {
    succeeded: result.succeeded,
    tx_hash: result.tx_hash,
    amount_out: result.amount_out,
    error: result.error,
    declined: false,
    unknown: result.unknown,
  };
}
// ========================================
// --- REFRESH ---------------------------
// read the feed again, so the card shows the new status and the hash.
//
// --- WHY IT IS AFTER THE SEND AND NOT INSIDE IT: the refresh is the
// feed's business, and the send is the swap's. a caller that wants the
// feed refreshed after the send asks for it, and a caller that does
// not does not pay for it.
export async function shit_1170_feed_swap_send_refresh_fun(): Promise<void> {
  await SHIT_1170_APP_PAGE_FEED_STORE.refresh();
}
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_SWAP_SEND = {
  send: shit_1170_feed_send_swap_fun,
  refresh: shit_1170_feed_swap_send_refresh_fun,
};
// ========================================
// copyright 2026 by sleet.near
