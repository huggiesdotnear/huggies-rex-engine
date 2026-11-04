// ========================================
// SHIT_1170_SWAP_QUEUE
// the shapes of our own swap queue routes, under /api/shit-1170/swap-queue.
//
// a queued SWAP is what an agent puts up for offer: the token in, the
// amount in and the token out. it is NOT a queued batch of transactions
// — the agent does not know the route, and the route is worked out at
// the moment somebody executes it.
//
// the model is two levels deep:
//
//   a SWAP            tokenIn / amountIn / tokenOut / amountOut / dexId
//     └── an ACCOUNT ROW    accountId / status / txHash / amountOut
//
// --- WHY --- the fields are camelCase: they mirror the browser's own
// session object (`accountId`), so nothing is renamed on the way.
//
// --- WHY --- `amountIn` is the RAW unit amount and not a human amount:
// the chain and the router trade the token's smallest unit, and a human
// amount is only meaningful next to the token it belongs to — "1.5 NEAR"
// and "1.5 USDC" are different trades. the raw number means the same
// thing whatever the token's decimals are.
//
// --- WHY --- `amountOut` is OPTIONAL: a swap may be queued without a
// quote, and the quote is worked out live on the feed page. the stored
// one is only the fallback.
//
// --- WHY --- there is no status on the swap and none on the queue: the
// truth is on the account row. a queued swap is never done — any
// account may still execute it — so there is nothing for a swap status
// to say, and two accounts executing the same queued swap produce two
// different on-chain transactions with two different outcomes.
// ========================================

// where one account stands with one queued swap.
//
// --- WHY --- four states and not two: `sent` means "it went out and
// nobody knows how it went yet", which is the real state of a
// transaction the moment the wallet signs it. `succeeded` and `failed`
// come later, when the outcome is read off the chain.
export type SHIT_1170_SWAP_QUEUE_STATUS =
  "pending" | "sent" | "succeeded" | "failed";

// one account on one queued swap — the WHO object.
export interface SHIT_1170_SWAP_QUEUE_ACCOUNT {
  // the account.
  accountId: string;
  // where the account is with this swap.
  status: SHIT_1170_SWAP_QUEUE_STATUS;
  // the hash of the transaction the account sent. it is null until
  // somebody sends.
  txHash: string | null;
  // the amount that came out, in the output token's smallest unit. it is
  // null until somebody sends.
  amountOut: string | null;
}

// one queued swap.
export interface SHIT_1170_SWAP_QUEUE {
  // the swap's id.
  swapId: string;
  // what the swap does, in words. it may be nothing.
  what: string | null;
  // when it should happen, in words. it may be nothing.
  when: string | null;
  // why the user wants it. it may be nothing.
  why: string | null;
  // the machine-readable `when`, epoch ms. it may be nothing.
  whenAt: number | null;
  // the token being sold.
  tokenIn: string;
  // the raw amount of the token in that is sold.
  amountIn: string;
  // the token being bought.
  tokenOut: string;
  // the quoted amount out, in the output token's smallest unit. it may
  // be nothing.
  amountOut: string | null;
  // the dex the quote came from. it may be nothing.
  dexId: string | null;
  // the WHO — the accounts this swap is for.
  accounts: SHIT_1170_SWAP_QUEUE_ACCOUNT[];
  // when the swap was queued, in ms since the epoch.
  createdAt: number;
  // when the swap was last touched, in ms since the epoch.
  updatedAt: number;
}

// the answer of the list route.
export interface SHIT_1170_SWAP_QUEUE_LIST {
  // the swaps on this page.
  items: SHIT_1170_SWAP_QUEUE[];
  // how many swaps matched, BEFORE the limit and the offset took their
  // cut. it is how many pages there are.
  total: number;
}

// --- REQUEST ----------------------------
// the queue body: a swap and the WHO it is for.
//
// --- WHY --- everything but the swap itself is optional: an agent that
// knows the WHAT and not the WHY must still be able to queue. a
// made-up WHY is worse than no WHY.
export interface SHIT_1170_SWAP_QUEUE_REQUEST {
  // what the swap does, in words.
  what?: string;
  // when it should happen, in words.
  when?: string;
  // why the user wants it.
  why?: string;
  // the machine-readable `when`, epoch ms.
  whenAt?: number;
  // the token being sold. it is required.
  tokenIn: string;
  // the raw amount of the token in that is sold, in the token's
  // smallest unit. it is required.
  amountIn: string;
  // the token being bought. it is required.
  tokenOut: string;
  // the quoted amount out, in the output token's smallest unit.
  amountOut?: string;
  // the dex the quote came from.
  dexId?: string;
  // the WHO — the accounts the agent is queuing this for. every account
  // in it must be one the agent holds an api key for.
  accounts?: string[];
}

// the body of the add-an-account route.
export interface SHIT_1170_SWAP_QUEUE_ACCOUNT_REQUEST {
  // the account being added. it must be the account the api key
  // belongs to.
  accountId: string;
}

// the body of the sent route.
//
// --- WHY --- there is ONE hash and not a list: a queued swap is ONE
// swap, and one swap is one send. the tx queue carries a list because
// it queues a BATCH of transactions.
export interface SHIT_1170_SWAP_QUEUE_SENT_REQUEST {
  // the hash of the transaction that went out. it is required.
  txHash: string;
  // the outcome. it may be left out, and then the status is `sent` — it
  // went out and nobody knows how it went yet.
  status?: SHIT_1170_SWAP_QUEUE_STATUS;
  // the amount that came out, in the output token's smallest unit. it
  // may be left out, and then it is simply not known.
  amountOut?: string;
}

// --- QUERY ------------------------------
// the filters of the swap list.
export interface SHIT_1170_SWAP_QUEUE_QUERY {
  // only the swaps this account is on.
  account_id?: string;
  // with the account, drop the swaps this account has already sent.
  hide_sent?: boolean;
  // only the swaps that sell this token.
  token_in?: string;
  // only the swaps that buy this token.
  token_out?: string;
  // how many to return.
  limit?: number;
  // where to start.
  offset?: number;
}
// ========================================
// copyright 2026 by sleet.near
