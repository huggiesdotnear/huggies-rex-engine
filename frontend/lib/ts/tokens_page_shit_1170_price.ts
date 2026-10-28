// ========================================
// the price for the $SHIT page.
//
// ported from the SHIT info app's `shit_lp_price_ref.ts`:
//   - the token price comes from the intear price api
//     (https://prices.intear.tech/price?token_id=), which returns a raw
//     number as a plain string.
//
// --- WHY --- the price api and not the summary's own `price_usd` field:
// the api is the price source the app already trusts for this token,
// and the two answer the same number.
//
// --- WHY --- there is no LP-pool reference here. the pool view and the
// pair token's price were fetched so the page could show the pool's
// implied price and its tvl next to the token's price. the page does
// not show them, so the pool is not fetched at all — a missing pool
// must not hold up the price, and a price nobody asked for is just a
// request for nothing.
import { HUGGIES_SHIT_TOKEN_ID } from "./shit_token";
// ========================================
// the price api that answers a raw price string for a token id.
const HUGGIES_PRICE_API_URL = "https://prices.intear.tech/price";
// ========================================
// the price of the token, from the intear price api.
export interface HUGGIES_SHIT_PRICE {
  // the token price in usd.
  price_usd: number;
  // why the price is missing, when it is.
  price_error: string | null;
}
// ========================================
// --- PUBLIC -----------------------------
// fetch the price of the SHIT token.
export async function fetch_shit_price_fun(): Promise<HUGGIES_SHIT_PRICE> {
  try {
    const response = await fetch(
      `${HUGGIES_PRICE_API_URL}?token_id=${encodeURIComponent(HUGGIES_SHIT_TOKEN_ID)}`,
      { cache: "no-cache" },
    );
    if (!response.ok) {
      throw new Error(`price api answered ${response.status}`);
    }
    const text = (await response.text()).trim();
    const price_usd = Number.parseFloat(text);
    if (!Number.isFinite(price_usd)) {
      throw new Error("price api answered a non-number");
    }
    return { price_usd, price_error: null };
  } catch (err: unknown) {
    return {
      price_usd: 0,
      price_error: err instanceof Error ? err.message : String(err),
    };
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
