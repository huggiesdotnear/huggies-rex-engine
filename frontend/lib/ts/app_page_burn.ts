// ========================================
// the burn page's ONE load: every fetch the page makes happens here.
//
// read this file to know what the burn page requests. that is the
// whole point of it.
//
// WHAT THE PAGE REQUESTS
//   1. GET /balances   the direct + native balances of burn.sleet.near
//   2. GET /balances   the direct + native balances of burn.huggies.near
//   3. GET /tokens     the token metadata for every token the two
//                       accounts hold: symbol, decimals, icon hash and
//                       the total supply.
//
// --- WHY --- two balance requests and not one: the api reads one
// account per call, so there is no way to ask for both at once. they
// run in parallel, so the page is as slow as its slowest one.
//
// --- WHY --- the balances are COMBINED and not shown per account: the
// page answers one question — "how much is burned in total". a
// reader wants one number per token, not two numbers to add up
// themselves.
//
// --- WHY --- the total supply comes from intear and not from a near
// view: intear already indexes the supply of every token it knows, so
// one /tokens call answers it for every token on the page at once. a
// near view of ft_total_supply would be one contract call PER TOKEN.
import { api_intear_balances_get } from "@sleet-js/middleman-intear-api";
import { api_intear_tokens_get } from "@sleet-js/middleman-intear-api";
import { HUGGIES_BURN_ADDRESSES } from "./app_page_burn_addresses";
import { icon_hash_of_fun, token_icon_for_fun } from "./token_icon_url";
import { HUGGIES_SUPPLY_PERCENT } from "./token_supply_percent";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the balance sources the page reads. "direct" is what the account
// holds itself.
//
// --- WHY --- "direct" and NOT "native": the native source is the
// chain's own NEAR balance, and a burn address is locked and empty of
// everything but a little gas. the gas left on it is not burned
// supply, it is the dust the account needs to exist — and on
// burn.sleet.near it reads as 0.00. so the page asks for the tokens
// that were actually sent to be burned, and not the gas.
const HUGGIES_BURN_BALANCE_SOURCES = ["direct"] as const;
// the token fields the burn cards show.
//
// `icon_hash` and not `icon`: the icon field is a full inline svg data
// uri and makes up almost the entire payload. the hash is 16
// characters, and the icon itself is served from a content-addressed
// url the browser caches for a year. see lib/ts/token_icon_url.ts.
//
// `total_supply` is the supply in the token's smallest unit, so the
// percent math stays exact on big numbers.
const HUGGIES_BURN_TOKEN_FIELDS = [
  "symbol",
  "decimals",
  "icon_hash",
  "total_supply",
] as const;
// ========================================
// ========================================
// --- TYPES ------------------------------
// one token held by the burn accounts.
export interface HUGGIES_APP_PAGE_BURN_TOKEN {
  // the token's account id, e.g. "usdc.near".
  id: string;
  // the ticker.
  symbol: string;
  // the token's decimals.
  decimals: number;
  // the icon url, or null when the token has no icon.
  icon: string | null;
  // the combined balance of both burn accounts, in the token's
  // smallest unit, as the raw decimal string the api reports.
  raw: string;
  // the total supply, in the token's smallest unit, as the raw
  // decimal string the api reports.
  total_supply_raw: string;
  // the share of the supply that is burned, as a percentage.
  percent: number;
}
// ========================================
// everything the burn page has loaded.
export interface HUGGIES_APP_PAGE_BURN_DATA {
  // one entry per token held by either burn account, biggest burned
  // amount first.
  tokens: ReadonlyArray<HUGGIES_APP_PAGE_BURN_TOKEN>;
  // one message per thing that failed.
  errors: ReadonlyArray<string>;
}
// ========================================
// --- HELPERS ----------------------------
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed =
    typeof value === "number" ? Number(value) : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// read a decimal string the api reports, keeping it as a string so the
// big-integer math downstream stays exact.
// --- WHY --- a supply with 18 decimals does not fit in a double, and
// the percent math needs every digit of it.
function to_decimal_string_fun(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}
// add two raw decimal strings. both are integers in the token's
// smallest unit, so the sum is an exact integer.
// --- WHY --- BigInt and not Number: a 24-decimal NEAR balance does not
// fit in a double's exact integer range, and the sum has to be exact
// or the percent below it is a lie.
function add_decimal_strings_fun(a: string, b: string): string {
  try {
    return (BigInt(a) + BigInt(b)).toString();
  } catch {
    // a malformed raw value must not take the whole page down; the
    // card then shows the value we could read.
    return a;
  }
}
// ========================================
// --- BALANCES --------------------------
// the raw balances of one burn account, by token id.
//
// a failed account is an empty map and a message: the other account's
// tokens still show, and the page says which account failed.
async function fetch_burn_balances_fun(
  account_id: string,
): Promise<{ balances: Map<string, string>; error: string | null }> {
  try {
    const response = await api_intear_balances_get({
      account: account_id,
      sources: HUGGIES_BURN_BALANCE_SOURCES,
    });
    const balances = new Map<string, string>();
    for (const row of response.balances.rows) {
      // a 0 balance means the account merely touched the token once; it
      // is not a holding and must not reach a card.
      if (row[2] === "0") continue;
      balances.set(row[0], row[2]);
    }
    return { balances, error: null };
  } catch (err) {
    return {
      balances: new Map(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
// ========================================
// --- METADATA --------------------------
// the metadata for the tokens the burn accounts hold.
//
// --- WHY --- the durable fields are asked for once for the whole page:
// the accounts hold the same tokens as each other far more often than
// not, so one call covers every card.
async function fetch_burn_metadata_fun(
  ids: ReadonlyArray<string>,
): Promise<Map<string, HUGGIES_BURN_META>> {
  const out = new Map<string, HUGGIES_BURN_META>();
  if (ids.length === 0) return out;
  const response = await api_intear_tokens_get({
    fields: HUGGIES_BURN_TOKEN_FIELDS,
    ids: [...ids],
  });
  // --- WHY --- the row is read by column NAME, not by index: the api
  // always returns `account_id` as the first column, even when it was
  // not requested, so a fixed index read is shifted by one.
  const columns = response.columns;
  const id_at = columns.indexOf("account_id");
  const symbol_at = columns.indexOf("symbol");
  const decimals_at = columns.indexOf("decimals");
  const hash_at = columns.indexOf("icon_hash");
  const supply_at = columns.indexOf("total_supply");
  for (const row of response.rows) {
    const id = String(id_at >= 0 ? row[id_at] : row[0]);
    const symbol = symbol_at >= 0 ? row[symbol_at] : row[1];
    const decimals = decimals_at >= 0 ? row[decimals_at] : row[2];
    const hash = hash_at >= 0 ? row[hash_at] : row[3];
    const supply = supply_at >= 0 ? row[supply_at] : row[4];
    out.set(id, {
      symbol: typeof symbol === "string" && symbol.length > 0 ? symbol : id,
      decimals: to_finite_number_fun(decimals),
      icon_hash: icon_hash_of_fun(hash),
      total_supply_raw: to_decimal_string_fun(supply, "0"),
    });
  }
  return out;
}
// ========================================
// --- META ------------------------------
// the metadata of one token, as the burn cards need it.
interface HUGGIES_BURN_META {
  symbol: string;
  decimals: number;
  icon_hash: string | null;
  total_supply_raw: string;
}
// ========================================
// --- LOAD -------------------------------
// fetch everything the burn page shows.
//
// the two accounts are read in parallel: they are two different
// accounts, so they are two requests, and running them together makes
// the page as fast as its slowest one.
async function app_page_burn_load_fun(): Promise<HUGGIES_APP_PAGE_BURN_DATA> {
  const errors: Array<string> = [];

  const per_account = await Promise.all(
    HUGGIES_BURN_ADDRESSES.map(async (account_id) => ({
      account_id,
      result: await fetch_burn_balances_fun(account_id),
    })),
  );

  // the combined balance per token, across every burn account.
  const combined = new Map<string, string>();
  for (const { account_id, result } of per_account) {
    if (result.error !== null) {
      errors.push(`${account_id}: ${result.error}`);
      continue;
    }
    for (const [id, raw] of result.balances) {
      const current = combined.get(id);
      combined.set(
        id,
        current === undefined ? raw : add_decimal_strings_fun(current, raw),
      );
    }
  }

  const ids = [...combined.keys()];
  if (ids.length === 0) return { tokens: [], errors };

  let meta_map = new Map<string, HUGGIES_BURN_META>();
  try {
    meta_map = await fetch_burn_metadata_fun(ids);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  // the tokens the metadata call did not answer for. they are asked for
  // again on their own, because a card without a symbol is a card the
  // reader cannot read.
  const missing = ids.filter((id) => !meta_map.has(id));
  if (missing.length > 0) {
    try {
      const found = await fetch_burn_metadata_fun(missing);
      for (const [id, meta] of found) meta_map.set(id, meta);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  const tokens: Array<HUGGIES_APP_PAGE_BURN_TOKEN> = [];
  for (const [id, raw] of combined) {
    const meta = meta_map.get(id);
    if (meta === undefined) continue;
    tokens.push({
      id,
      symbol: meta.symbol,
      decimals: meta.decimals,
      icon: token_icon_for_fun(id, meta.icon_hash),
      raw,
      total_supply_raw: meta.total_supply_raw,
      percent: HUGGIES_SUPPLY_PERCENT.percent(raw, meta.total_supply_raw),
    });
  }

  // the cards are ordered by the burned amount, biggest first, so the
  // token that carries the most value is the first thing read.
  //
  // --- WHY --- the comparison is on BigInt and not on the formatted
  // amount: the raw values are integers in the token's smallest unit,
  // and two tokens with different decimals would sort wrongly by their
  // human amounts.
  tokens.sort((a, b) => {
    try {
      const a_big = BigInt(a.raw);
      const b_big = BigInt(b.raw);
      if (a_big === b_big) return a.symbol.localeCompare(b.symbol);
      return a_big > b_big ? -1 : 1;
    } catch {
      // a malformed raw value must not take the whole page down; the
      // card keeps the order it came in with.
      return 0;
    }
  });

  return { tokens, errors };
}
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_BURN = {
  load: app_page_burn_load_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
