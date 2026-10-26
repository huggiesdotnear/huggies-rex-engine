// ========================================
// price and LP-pool reference for the SHIT page.
//
// ported from the SHIT info app's `shit_lp_price_ref.ts`:
//   - the token price comes from the intear price api
//     (https://prices.intear.tech/price?token_id=), which returns a raw
//     number as a plain string.
//   - the pool reference comes from the ref finance `get_pool` view,
//     priced against the paired token's price.
//
// the pool reference is a *reference*: the summary price stays the
// intear `price_usd`, and the pool is shown next to it so the two can
// be compared.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import { near_kit_contract_view_fun_json } from "../../../middleman/near_kit_tool_box";
import {
  HUGGIES_SHIT_DECIMALS,
  HUGGIES_SHIT_MAIN_POOL,
  HUGGIES_SHIT_TOKEN_ID,
} from "./shit_config";
// ========================================
// the price api that answers a raw price string for a token id.
const HUGGIES_PRICE_API_URL = "https://prices.intear.tech/price";
// ========================================
// the ref finance contract that owns the pools.
const HUGGIES_REF_CONTRACT_ID = "v2.ref-finance.near";
// ========================================
// the ref pool id of the SHIT/wNEAR pool.
const HUGGIES_SHIT_POOL_ID = 5767;
// ========================================
// the token id of the pool's other side.
const HUGGIES_SHIT_POOL_PAIR_TOKEN_ID = "wrap.near";
// ========================================
// decimals of the pool's other token.
const HUGGIES_SHIT_POOL_PAIR_DECIMALS = 24;
// ========================================
// one pool as the ref finance view returns it.
export interface HUGGIES_SHIT_POOL {
  pool_kind: string;
  token_account_ids: string[];
  amounts: string[];
  shares_total_supply: string;
}
// ========================================
// the price of the token, from the intear price api.
export interface HUGGIES_SHIT_PRICE_REF {
  // the token price in usd.
  price_usd: number;
  // the ref pool id, when the pool view succeeded.
  pool_id: number | null;
  // the pool's other token id, when the pool view succeeded.
  pool_pair_token_id: string | null;
  // the amount of SHIT in the pool, human readable.
  pool_shit_amount: number | null;
  // the amount of the other token in the pool, human readable.
  pool_pair_amount: number | null;
  // the price of SHIT implied by the pool reserves.
  pool_implied_price_usd: number | null;
  // the pool's tvl in usd, as far as it can be derived.
  pool_tvl_usd: number | null;
  // the label of the pool, e.g. "REF-5767".
  pool_label: string | null;
  // why the pool reference is missing, when it is.
  pool_error: string | null;
}
// ========================================
// --- HELPERS ----------------------------
// read one token price from the intear price api.
async function fetch_token_price_fun(token_id: string): Promise<number> {
  const response = await fetch(
    `${HUGGIES_PRICE_API_URL}?token_id=${encodeURIComponent(token_id)}`,
    { cache: "no-cache" },
  );
  if (!response.ok) {
    throw new Error(`price api answered ${response.status} for ${token_id}`);
  }
  const text = (await response.text()).trim();
  const price = Number.parseFloat(text);
  if (!Number.isFinite(price)) {
    throw new Error(`price api answered a non-number for ${token_id}`);
  }
  return price;
}
// ========================================
// scale a raw token amount down by its decimals.
function raw_to_human_fun(raw: string, decimals: number): number {
  const scaled = Number(raw);
  if (!Number.isFinite(scaled)) return 0;
  return scaled / 10 ** decimals;
}
// ========================================
// fetch the ref finance pool this token is priced against.
async function fetch_shit_pool_fun(): Promise<HUGGIES_SHIT_POOL | null> {
  const pool = await near_kit_contract_view_fun_json<HUGGIES_SHIT_POOL>(
    near_kit_client(),
    HUGGIES_REF_CONTRACT_ID,
    "get_pool",
    { pool_id: HUGGIES_SHIT_POOL_ID },
  );
  if (!Array.isArray(pool.token_account_ids)) return null;
  return pool;
}
// ========================================
// --- PUBLIC -----------------------------
// fetch the price and the LP-pool reference for the SHIT token.
export async function fetch_shit_price_ref_fun(): Promise<HUGGIES_SHIT_PRICE_REF> {
  const empty: HUGGIES_SHIT_PRICE_REF = {
    price_usd: 0,
    pool_id: null,
    pool_pair_token_id: null,
    pool_shit_amount: null,
    pool_pair_amount: null,
    pool_implied_price_usd: null,
    pool_tvl_usd: null,
    pool_label: null,
    pool_error: null,
  };
  // the price is the important half — a missing pool must not hide it.
  let price_usd = 0;
  try {
    price_usd = await fetch_token_price_fun(HUGGIES_SHIT_TOKEN_ID);
  } catch {
    price_usd = 0;
  }
  let pool: HUGGIES_SHIT_POOL | null = null;
  try {
    pool = await fetch_shit_pool_fun();
  } catch (err: unknown) {
    return {
      ...empty,
      price_usd,
      pool_label: HUGGIES_SHIT_MAIN_POOL,
      pool_error: err instanceof Error ? err.message : String(err),
    };
  }
  if (pool === null) {
    return {
      ...empty,
      price_usd,
      pool_label: HUGGIES_SHIT_MAIN_POOL,
      pool_error: "pool view returned no usable pool",
    };
  }
  // locate SHIT inside the pool, so the pair side is whichever side it
  // is not.
  const shit_index = pool.token_account_ids.indexOf(HUGGIES_SHIT_TOKEN_ID);
  if (shit_index === -1) {
    return {
      ...empty,
      price_usd,
      pool_label: HUGGIES_SHIT_MAIN_POOL,
      pool_error: "pool does not contain the token",
    };
  }
  const pair_index = shit_index === 0 ? 1 : 0;
  const pair_token_id = pool.token_account_ids[pair_index];
  const shit_amount = raw_to_human_fun(
    pool.amounts[shit_index] ?? "0",
    HUGGIES_SHIT_DECIMALS,
  );
  const pair_amount = raw_to_human_fun(
    pool.amounts[pair_index] ?? "0",
    HUGGIES_SHIT_POOL_PAIR_DECIMALS,
  );
  // the pool's implied price needs the paired token's price too.
  let pair_price = 0;
  try {
    pair_price = await fetch_token_price_fun(pair_token_id);
  } catch {
    pair_price = 0;
  }
  const implied_price =
    shit_amount > 0 ? (pair_amount * pair_price) / shit_amount : null;
  return {
    price_usd,
    pool_id: HUGGIES_SHIT_POOL_ID,
    pool_pair_token_id: pair_token_id,
    pool_shit_amount: shit_amount,
    pool_pair_amount: pair_amount,
    pool_implied_price_usd: implied_price,
    pool_tvl_usd:
      implied_price === null ? null : shit_amount * implied_price * 2,
    pool_label: HUGGIES_SHIT_MAIN_POOL,
    pool_error: null,
  };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
