// ========================================
// fetch the live metadata of the emojifi spotlight tokens: symbol,
// price and holders, straight from INTEAR by id.
// ========================================
import { api_intear_tokens_get } from "../../../middleman";
import { token_row_by_name_fun } from "./token_row_by_name";
import { emoji_token_entries_fun } from "./emoji_token_entries";
// ========================================

// ========================================
// --- CONFIG -----------------------------
// the fields the spotlight shows for each token.
const HUGGIES_EMOJI_TOKEN_FIELDS = [
  "symbol",
  "decimals",
  "icon",
  "price_usd",
  "holders",
] as const;
// ========================================
// --- SHAPE ------------------------------
// one spotlight token: the emoji that stands for it plus its live
// market data.
export interface HUGGIES_EMOJI_SPOTLIGHT_TOKEN {
  emoji: string;
  token_id: string;
  label: string;
  symbol: string;
  icon: string | null;
  price_usd: number;
  holders: number;
}
// ========================================
// --- HELPERS ----------------------------
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// --- FETCH -----------------------------
// fetch the live metadata for every emojifi token, in list order.
export async function fetch_emoji_spotlight_fun(): Promise<
  ReadonlyArray<HUGGIES_EMOJI_SPOTLIGHT_TOKEN>
> {
  const entries = emoji_token_entries_fun();
  if (entries.length === 0) return [];
  const ids = entries.map((entry) => entry.token_id as string);
  const response = await api_intear_tokens_get({
    ids,
    fields: HUGGIES_EMOJI_TOKEN_FIELDS,
  });
  const by_id = new Map<string, Record<string, unknown>>();
  for (const row of response.rows) {
    const cell = token_row_by_name_fun(response.columns, row);
    const id = typeof cell.account_id === "string" ? cell.account_id : "";
    if (id.length > 0) by_id.set(id, cell);
  }
  const out: HUGGIES_EMOJI_SPOTLIGHT_TOKEN[] = [];
  for (const entry of entries) {
    const token_id = entry.token_id as string;
    const cell = by_id.get(token_id);
    // --- WHY --- a token intear does not know is skipped rather than
    // rendered with a zero price: a row reading "$0.00" claims the
    // token is worthless, when the truth is that it is not indexed.
    if (cell === undefined) continue;
    const symbol = cell.symbol;
    const icon = cell.icon;
    out.push({
      emoji: entry.emoji,
      token_id,
      label: entry.label,
      symbol:
        typeof symbol === "string" && symbol.length > 0 ? symbol : entry.label,
      icon: typeof icon === "string" && icon.length > 0 ? icon : null,
      price_usd: to_finite_number_fun(cell.price_usd),
      holders: to_finite_number_fun(cell.holders),
    });
  }
  return out;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
