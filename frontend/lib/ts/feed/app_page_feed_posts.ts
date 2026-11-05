// ========================================
// the feed's POSTS: the queued batches and the queued swaps, in ONE
// ordered list.
//
// the feed shows two kinds of thing. a queued BATCH is a set of function
// calls waiting to be signed. a queued SWAP is a token in, an amount in
// and a token out waiting to be traded. they are different resources
// with different shapes, and they are fetched by two different loaders.
//
// --- WHY THEY ARE MERGED INTO ONE LIST: the reader reads one feed. two
// lists would mean two scrolls, two "nothing here" messages and two
// orders to think about, and the reader would have to decide which list
// to look at. one list, two kinds of card.
//
// --- WHY THE MERGE IS HERE AND NOT IN THE COMPONENT: the component
// draws the cards, and the ORDER of the cards is the feed's business.
// the store holds the order.
//
// --- WHY THE KIND IS A TAG AND NOT A SHAPE CHECK: a component that
// asked "is this a queue or a swap?" by looking at the shape would be
// guessing. the kind says which one it is.
import type {
  SHIT_1170_SWAP_QUEUE,
  SHIT_1170_TX_QUEUE,
} from "@huggies/shit-1170-rex-engine-middleman";
import type { SHIT_1170_SWAP_QUOTE } from "../shared/swap_quote";
import type { SHIT_1170_SWAP_ROUTE } from "../shared/swap_routes";
import type {
  SHIT_1170_FEED_DIRECTION,
  SHIT_1170_FEED_SORT,
} from "./app_page_feed_types";
// ========================================
// --- TYPES ------------------------------
// which kind of post this is.
export type SHIT_1170_FEED_POST_KIND = "queue" | "swap";

// one post on the feed.
export type SHIT_1170_FEED_POST =
  | {
      kind: "queue";
      // the queued batch.
      queue: SHIT_1170_TX_QUEUE;
    }
  | {
      kind: "swap";
      // the queued swap.
      swap: SHIT_1170_SWAP_QUEUE;
      // the live quote of the swap, or null when the router could not
      // answer. the swap then shows the quote the backend stored.
      quote: SHIT_1170_SWAP_QUOTE | null;
      // the live routes of the swap, best first. the SWAP NOW button
      // signs the BEST one — the route whose amount out is the one the
      // card is showing.
      routes: ReadonlyArray<SHIT_1170_SWAP_ROUTE>;
    };
// ========================================
// ========================================
// --- MERGE -----------------------------
// the batches and the swaps in ONE list, ordered the way the reader
// asked for.
//
// --- WHY THE TWO LISTS ARE MERGED AND SORTED TOGETHER: the reader asked
// for a feed, and a feed is one ordered list. sorting each list on its
// own and then showing them one after the other would read as two
// feeds.
//
// --- WHY THE SORT IS DONE HERE AND NOT BY THE API: the api has no sort
// parameter for either list, and the loaded lists are small enough that
// sorting them costs nothing.
//
// --- WHY DATE ADDED IS BY CREATION TIME: that is when the thing was
// queued, and a feed of queued work reads newest-first.
//
// --- WHY MOST POPULAR IS BY THE NUMBER OF ACCOUNTS: a post with more
// accounts on it has more people waiting for it, and that is what a
// social feed measures.
export function shit_1170_feed_posts_fun(
  queues: ReadonlyArray<SHIT_1170_TX_QUEUE>,
  swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>,
  quotes: ReadonlyArray<SHIT_1170_SWAP_QUOTE | null>,
  routes: ReadonlyArray<ReadonlyArray<SHIT_1170_SWAP_ROUTE>>,
  sort: SHIT_1170_FEED_SORT,
  direction: SHIT_1170_FEED_DIRECTION,
): SHIT_1170_FEED_POST[] {
  const posts: SHIT_1170_FEED_POST[] = [];

  for (const queue of queues) {
    posts.push({ kind: "queue", queue });
  }

  for (let index = 0; index < swaps.length; index++) {
    const swap = swaps[index];
    if (swap === undefined) continue;
    posts.push({
      kind: "swap",
      swap,
      quote: quotes[index] ?? null,
      routes: routes[index] ?? [],
    });
  }

  // --- WHY --- THE DESCENDING ORDER IS THE DEFAULT AND THE ASCENDING
  // ONE IS THE FLIP: the feed reads newest-first, and the direction
  // button turns it over. the sort key says WHICH number, and the
  // direction says which way round.
  const sign = direction === "asc" ? 1 : -1;

  if (sort === "most_popular") {
    posts.sort((a, b) => sign * (accounts_of_fun(b) - accounts_of_fun(a)));
    return posts;
  }

  posts.sort((a, b) => sign * (created_at_of_fun(b) - created_at_of_fun(a)));
  return posts;
}
// ========================================
// --- HELPERS ----------------------------
// how many accounts are on a post.
function accounts_of_fun(post: SHIT_1170_FEED_POST): number {
  if (post.kind === "queue") return post.queue.accounts.length;
  return post.swap.accounts.length;
}

// when a post was queued, in ms since the epoch.
function created_at_of_fun(post: SHIT_1170_FEED_POST): number {
  if (post.kind === "queue") return post.queue.createdAt;
  return post.swap.createdAt;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
