// ========================================
// the feed page's SWAPS.
//
// the feed holds two kinds of post: a queued BATCH of transactions, and
// a queued SWAP. the swap has no calls yet — the agent named a token in,
// an amount in and a token out — so the feed asks the swap queue for
// those, and asks the router for the live amount out.
//
// --- WHY THE SWAPS ARE A SEPARATE FILE AND NOT IN THE FEED'S LOADER:
// the feed's loader fetches the QUEUES. the swaps are a different
// resource with a different shape, and mixing the two would make the
// loader do two jobs.
//
// --- WHY THE TOKENS ARE ASKED FOR IN ONE CALL: a feed of ten swaps can
// name the same token twice, and one request for the set is one request
// and not ten.
import {
  api_shit_1170_swap_queue_get,
  type SHIT_1170_SWAP_QUEUE,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_BASE_URL } from "../shared/base_url";
import { api_key_options_fun } from "../shared/api_key_token";
import { fetch_transfer_tokens_by_ids_fun } from "../shared/transfer_tokens";
import {
  shit_1170_swap_quotes_fun,
  type SHIT_1170_SWAP_QUOTE,
} from "../shared/swap_quote";
import type { SHIT_1170_TRANSFER_TOKEN } from "../shared/transfer_tokens";
// ========================================
// --- TYPES ------------------------------
// what one load of the swaps brings back.
export interface SHIT_1170_APP_PAGE_FEED_SWAPS_LOADED {
  // the queued swaps on screen.
  swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>;
  // the token metadata for the two tokens each swap names.
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
  // the live quote of each swap, in the SAME order as `swaps`. an entry
  // is null when the router could not answer.
  quotes: ReadonlyArray<SHIT_1170_SWAP_QUOTE | null>;
}
// ========================================
// --- CONFIG -----------------------------
// how many swaps the feed asks for.
//
// --- WHY --- it is the same number the queues use: a feed of fifty is a
// screen or two, and both kinds of post share that screen.
const SHIT_1170_FEED_SWAP_LIMIT = 50;
// ========================================
// --- LOAD ------------------------------
// load the queued swaps, their tokens and their live quotes.
//
// --- WHY THE QUOTES ARE TAKEN HERE AND NOT IN A COMPONENT: a component
// that fetches is a component that can fetch at the wrong time, and the
// feed's rule is that the components only display. so the quotes come
// with the load.
//
// --- WHY A FAILED QUOTE DOES NOT FAIL THE LOAD: the router is a third
// party. the swaps are still worth showing without their live numbers,
// because the backend's stored quote is the fallback.
export async function shit_1170_feed_swaps_load_fun(
  account_id: string | null,
): Promise<SHIT_1170_APP_PAGE_FEED_SWAPS_LOADED> {
  const options = await api_key_options_fun(false, account_id ?? undefined);
  const result = await api_shit_1170_swap_queue_get(
    SHIT_1170_BASE_URL,
    { limit: SHIT_1170_FEED_SWAP_LIMIT },
    options,
  );
  const swaps = result.items;
  const tokens = await load_swap_tokens_fun(swaps);
  const quotes = await load_swap_quotes_fun(swaps);
  return { swaps, tokens, quotes };
}

// ========================================
// --- TOKENS ----------------------------
// the token metadata for the tokens the swaps name.
//
// --- WHY A FAILURE HERE IS SWALLOWED: the swaps are still worth showing
// without their icons. a failure here costs the reader the icon and the
// symbol, and it must not cost them the feed.
async function load_swap_tokens_fun(
  swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>,
): Promise<Map<string, SHIT_1170_TRANSFER_TOKEN>> {
  const ids: string[] = [];
  for (const swap of swaps) {
    ids.push(swap.tokenIn, swap.tokenOut);
  }
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  try {
    return await fetch_transfer_tokens_by_ids_fun(unique);
  } catch (err) {
    console.warn(
      "[app_page_feed_swaps] the token metadata could not be read",
      err,
    );
    return new Map();
  }
}

// ========================================
// --- QUOTES ----------------------------
// the live quote of each swap.
//
// --- WHY THE QUOTES ARE TAKEN FOR ALL THE SWAPS AT ONCE: they are one
// batch of work, and the loading bar counts one batch.
async function load_swap_quotes_fun(
  swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>,
): Promise<ReadonlyArray<SHIT_1170_SWAP_QUOTE | null>> {
  if (swaps.length === 0) return [];
  try {
    return await shit_1170_swap_quotes_fun(
      swaps.map((swap) => ({
        token_in: swap.tokenIn,
        token_out: swap.tokenOut,
        amount_in: swap.amountIn,
      })),
    );
  } catch (err) {
    console.warn(
      "[app_page_feed_swaps] the live quotes could not be taken",
      err,
    );
    return swaps.map(() => null);
  }
}
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_SWAPS = {
  load: shit_1170_feed_swaps_load_fun,
};
// ========================================
// copyright 2026 by sleet.near
