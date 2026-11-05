// ========================================
// send a swap: the ONE way a route is signed.
//
// both the swap page's SWAP button and the feed's SWAP NOW button call
// this. the two are the same trade — the feed's card and the swap page
// are two views of one queued swap — so they must not be two
// implementations that drift.
//
// what it does, in order:
//   1. hand the route to the wallet in ONE popup,
//   2. ask the aggregator what actually happened,
//   3. record the result against the queued swap,
//   4. tell the reader.
//
// --- WHY THE FEED AND THE SWAP PAGE SHARE THIS: the feed's card shows
// a route and the swap page shows a route, and both are signed the
// same way. two copies of "execute, report, toast" would be two copies
// of the three-phase execution and the two could answer differently
// about what happened.
//
// --- WHY THE REPORT IS HERE AND NOT IN THE CALLER: the report is what
// makes the feed show SENT ✓ and the transaction link. a caller that
// forgot it would send the swap and leave the card saying WAITING.
import {
  api_shit_1170_swap_queue_sent_post,
  type SHIT_1170_SWAP_QUEUE,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_APP_PAGE_SWAP_EXECUTE } from "../swap/app_page_swap_execute";
import { SHIT_1170_BASE_URL } from "./base_url";
import { api_key_options_fun } from "./api_key_token";
import { SHIT_1170_TOAST_STORE } from "./toast_store";
import type { ROUTE } from "@sleet-js/intear-dex-aggregator-tool-box";
// ========================================
// --- TYPES ------------------------------
// what came of the send.
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
  swap_id: string,
  tx_hash: string,
  status: "succeeded" | "failed" | "sent",
  amount_out: string | null,
): Promise<void> {
  try {
    const options = await api_key_options_fun(true);
    await api_shit_1170_swap_queue_sent_post(
      SHIT_1170_BASE_URL,
      swap_id,
      {
        txHash: tx_hash,
        status,
        amountOut: amount_out ?? undefined,
      },
      options,
    );
  } catch (err) {
    console.warn("[swap_send] the swap could not be reported", err);
  }
}
// ========================================
// --- TOAST -----------------------------
// tell the reader what came of it.
//
// --- WHY THE TOAST IS HERE AND NOT IN THE CALLER: the reader is owed
// the same words wherever they pressed the button. the swap page says
// "SWAP DONE" and the feed says "SWAP DONE".
//
// --- WHY THE AMOUNT OUT IS SHOWN AS A HUMAN AMOUNT AND NOT A RAW ONE:
// the raw figure means nothing next to no token. the caller passes the
// decimals it already knows.
function show_result_fun(
  result: SHIT_1170_SWAP_SEND_RESULT,
  amount_out_human: string | null,
): void {
  if (result.declined) {
    // --- WHY --- A DECLINE IS NOT A TOAST: the reader said no, and that
    // is not a failure. a toast that said "it failed" would be telling
    // the reader they did something wrong.
    return;
  }
  if (result.succeeded) {
    SHIT_1170_TOAST_STORE.show(
      "success",
      "SWAP DONE",
      amount_out_human,
      result.tx_hash,
    );
    return;
  }
  if (result.unknown) {
    SHIT_1170_TOAST_STORE.show(
      "info",
      "SWAP SENT — CHECK IT",
      result.error,
      result.tx_hash,
    );
    return;
  }
  SHIT_1170_TOAST_STORE.show(
    "error",
    "SWAP FAILED",
    result.error,
    result.tx_hash,
  );
}
// ========================================
// --- SEND ------------------------------
// sign the route, record it against the queued swap and tell the
// reader.
//
// --- WHY THE ROUTE COMES IN AND IS NOT ASKED FOR HERE: the caller
// already has the route on screen — the feed's card and the swap page
// both show a live, subscribed route. asking for it again would be a
// second router call for a route the reader can already see, and the
// route they saw would not be the route they signed.
//
// --- WHY THE QUEUED SWAP IS OPTIONAL: the swap page can be opened on a
// plain swap with no queued swap behind it. there is nothing to
// record in that case, and the swap still goes out.
export async function shit_1170_swap_send_fun(props: {
  // the route to sign.
  route: ROUTE;
  // the token being sold.
  token_in: string;
  // the token being bought.
  token_out: string;
  // the account that signs.
  account_id: string;
  // the queued swap to record the send against, or null when there is
  // none.
  swap: SHIT_1170_SWAP_QUEUE | null;
  // the output token's decimals, for the amount out in the toast. null
  // when the token is unknown, and the toast then shows the raw figure.
  output_decimals: number | null;
}): Promise<SHIT_1170_SWAP_SEND_RESULT> {
  const execution = await SHIT_1170_APP_PAGE_SWAP_EXECUTE.execute(
    props.route,
    props.token_in,
    props.token_out,
    props.account_id,
  );

  const result: SHIT_1170_SWAP_SEND_RESULT = {
    succeeded: execution.succeeded,
    tx_hash: execution.tx_hash,
    amount_out: execution.amount_out,
    error: execution.error,
    declined: execution.declined,
    unknown: execution.unknown,
  };

  // --- WHY THE REPORT IS MADE BEFORE THE TOAST: the report is what
  // puts the swap's hash and its outcome on the feed, and the reader is
  // about to be told the swap went out. so the record is made first.
  if (props.swap !== null && result.tx_hash !== null) {
    const status = result.succeeded
      ? "succeeded"
      : result.unknown
        ? "sent"
        : "failed";
    await report_swap_fun(
      props.swap.swapId,
      result.tx_hash,
      status,
      result.amount_out,
    );
  }

  const amount_out_human =
    result.amount_out === null || props.output_decimals === null
      ? null
      : shit_1170_swap_amount_human_fun(
          result.amount_out,
          props.output_decimals,
        );
  show_result_fun(result, amount_out_human);

  return result;
}
// ========================================
// --- HELPERS ----------------------------
// the raw amount out as a human amount.
//
// --- WHY --- BigInt and not Number: a 24-decimal NEAR amount is far
// beyond Number's exact integer range, and a raw figure that lost its
// low digits would be a lie about what the reader received.
function shit_1170_swap_amount_human_fun(
  unit: string,
  decimals: number,
): string {
  const trimmed = unit.trim();
  if (!/^\d+$/.test(trimmed)) return trimmed;
  if (!Number.isInteger(decimals) || decimals <= 0) return trimmed;
  const padded = trimmed.padStart(decimals + 1, "0");
  const whole = padded.slice(0, padded.length - decimals);
  const fraction = padded.slice(padded.length - decimals).replace(/0+$/, "");
  if (fraction.length === 0) return whole;
  return `${whole}.${fraction}`;
}
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_SWAP_SEND = {
  send: shit_1170_swap_send_fun,
};
// ========================================
// copyright 2026 by sleet.near
