// ========================================
// the ft transfer reading of a QUEUED transaction.
//
// a queued transaction is a FUNCTION CALL — a contract, a method and
// some args. the args are raw json, so "100000000" tells a reader
// nothing. the tx page's transfer parser knows how to read a finished
// transaction's transfers, but a queued one has no chain records yet.
// so the app reads the args.
//
// --- WHY THE STANDARD IS THE READING: NEP-141 fixes the arg names of
// the three standard ft methods, so there is no guessing.
//
//   ft_transfer         (receiver_id, amount, memo?)
//   ft_transfer_call    (receiver_id, amount, memo?, msg)
//   ft_resolve_transfer (sender_id, receiver_id, amount)
//
// --- WHY THE TOKEN IS THE CONTRACT BEING CALLED: `ft_transfer` on
// `usdt.tether-token.near` transfers USDC. the contract IS the token,
// so there is no `token_id` arg to hunt for — the token is right there
// in the `contractId` the queue already stores.
//
// --- WHY ft_on_transfer IS NOT IN THE LIST: it is a method the token
// contract calls on the RECEIVER, and it never moves tokens itself —
// it decides how many of the attached tokens to keep. it is a
// callback, not a transfer.
//
// --- WHY IT IS SHARED AND NOT IN THE FEED'S FOLDER: the feed page and
// the queue page both read the same queued transactions the same way,
// and they must not drift on it.
import type {
  SHIT_1170_TX_QUEUE,
  SHIT_1170_TX_QUEUE_TRANSACTION,
} from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- TYPES ------------------------------
// one transfer read out of a queued call.
export interface SHIT_1170_QUEUE_TRANSFER {
  // the token's contract id. it is the contract being called.
  token_id: string;
  // the amount, in the token's smallest unit.
  amount: string;
  // who receives it, or null when the call does not say.
  receiver_id: string | null;
  // the method that was called, so the row can name it.
  method: string;
}

// ========================================
// --- METHODS ---------------------------
// the three standard ft methods.
//
// --- WHY --- they are a SET and not a list: the reading asks "is this
// method one of them", and a set answers that without a scan.
const SHIT_1170_FT_METHODS = new Set([
  "ft_transfer",
  "ft_transfer_call",
  "ft_resolve_transfer",
]);

// the swap methods, which are the second tier.
//
// --- WHY --- the swap is NOT an ft transfer: a swap has a token in AND
// a token out, and an amount in and a minimum amount out. the reader
// can show the token in and the amount in, but the amount out is a
// promise the chain settles — a queued swap does not know what it will
// get. so the swap row shows what is known and stops there.
const SHIT_1170_SWAP_METHODS = new Set(["ft_swap"]);
const SHIT_1170_SWAP_METHODS_ALT = new Set(["swap"]);
// ========================================
// ========================================
// --- HELPERS ----------------------------
// read one argument as a string.
//
// --- WHY --- the args are `unknown`: they come from json, and a number
// is as likely as a string. a number is turned into its digits so the
// amount reads the same whatever shape the agent wrote it in.
function arg_string_fun(
  args: Record<string, unknown>,
  key: string,
): string | null {
  const value = args[key];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }
  if (typeof value === "bigint") return value.toString();
  return null;
}
// ========================================
// ========================================
// --- READ ------------------------------
// the transfer one queued call makes, or null when it makes none.
//
// --- WHY --- AN UNRECOGNISED METHOD SHOWS NO TRANSFER: the honest
// answer. the transactions list still shows the raw args, so nothing is
// hidden — the reader can see the call, they just do not get a pretty
// amount for it.
export function shit_1170_queue_transfer_of_fun(
  transaction: SHIT_1170_TX_QUEUE_TRANSACTION,
): SHIT_1170_QUEUE_TRANSFER | null {
  const method = transaction.method.trim();
  const args = transaction.args ?? {};
  // the standard: the token IS the contract being called.
  if (SHIT_1170_FT_METHODS.has(method)) {
    const amount = arg_string_fun(args, "amount");
    if (amount === null) return null;
    return {
      token_id: transaction.contractId,
      amount,
      receiver_id: arg_string_fun(args, "receiver_id"),
      method,
    };
  }
  // the second tier: a swap shows the token in and the amount in, and
  // NOT the amount out.
  if (
    SHIT_1170_SWAP_METHODS.has(method) ||
    SHIT_1170_SWAP_METHODS_ALT.has(method)
  ) {
    const amount =
      arg_string_fun(args, "amount_in") ?? arg_string_fun(args, "amount");
    if (amount === null) return null;
    // --- WHY --- the token in is read from `token_in` and NOT from the
    // contract being called: a swap is called on the DEX, and the token
    // being sold is named in the args.
    const token_id =
      arg_string_fun(args, "token_in") ?? arg_string_fun(args, "token_id");
    if (token_id === null) return null;
    return {
      token_id,
      amount,
      receiver_id: null,
      method,
    };
  }
  return null;
}
// ========================================
// ========================================
// --- ALL -------------------------------
// every transfer a batch makes, in the order of the batch.
//
// --- WHY --- the list is built ONCE and both pages use it: the feed's
// post shows the first call line, and the queue page shows every
// transfer. one reading, two views.
export function shit_1170_queue_transfers_fun(
  queue: SHIT_1170_TX_QUEUE,
): SHIT_1170_QUEUE_TRANSFER[] {
  const out: SHIT_1170_QUEUE_TRANSFER[] = [];
  for (const transaction of queue.transactions) {
    const transfer = shit_1170_queue_transfer_of_fun(transaction);
    if (transfer !== null) out.push(transfer);
  }
  return out;
}
// ========================================
// ========================================
// --- TOKEN IDS -------------------------
// every token id the batch's transfers mention.
//
// --- WHY --- the whole batch is asked for in ONE call: a batch of three
// calls can name the same token twice, and one request for the set is
// one request and not three.
export function shit_1170_queue_token_ids_fun(
  queue: SHIT_1170_TX_QUEUE,
): string[] {
  const ids: string[] = [];
  for (const transfer of shit_1170_queue_transfers_fun(queue)) {
    ids.push(transfer.token_id);
  }
  return [...new Set(ids)];
}
// ========================================
// ========================================
// --- FIRST -----------------------------
// the transfer of the batch's FIRST call, or null.
//
// --- WHY --- the first call and not the biggest transfer: the post
// shows ONE call line, and the first call is the one the agent meant
// first. the queue page shows them all.
export function shit_1170_queue_first_transfer_fun(
  queue: SHIT_1170_TX_QUEUE,
): SHIT_1170_QUEUE_TRANSFER | null {
  const first = queue.transactions[0];
  if (first === undefined) return null;
  return shit_1170_queue_transfer_of_fun(first);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
