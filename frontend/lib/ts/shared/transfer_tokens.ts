// ========================================
// the token metadata for a set of transfers.
//
// a transfer names the token by its CONTRACT id — `usdt.tether-token.near`
// for a nep141 token, the contract for a nep245 multi token, the
// collection for a nep171 nft. it does NOT name the symbol, and it
// does NOT say how many decimals the amount is in.
//
// so a raw amount of "1500000" is meaningless on its own: it is 1.5
// USDC if the token has six decimals and 1.5 of nothing if it has
// none. the token's metadata turns the raw amount into a number a
// reader can read, and it brings the icon with it.
//
// this module is the one place that asks for that metadata for a
// transfer list, so the transaction page and the account page's
// transaction cards cannot drift.
//
// --- WHY IT IS A SHARED MODULE AND NOT PART OF THE TOKEN INFO READER:
// the token info reader is a general "what do I know about this
// token" call. this one knows about the SHAPE of a transfer — which
// contract id belongs to which transfer, and how a nep245 token id
// that points at another contract is resolved. that knowledge is what
// both surfaces need, and neither of them should hold it.
//
// --- WHY THE ICONS ARE NOT COUNTED BY THE LOADING BAR: the icons are
// `<img>` tags and the browser loads them itself. they are decoration
// — the amounts read without them — so the bar measures the data, not
// the pictures. same as everywhere else in the app.
import { SHIT_1170_TOKEN_INFO } from "./token_info";
import type { SHIT_1170_TOKEN_INFO as SHIT_1170_TOKEN_INFO_TYPE } from "./token_info";
import { SHIT_1170_NEAR_ID } from "./token_near";
import type { PARSE_RESULT } from "@sleet-js/fastnear-explorer-api-client";
// ========================================
// ========================================
// --- TYPES ------------------------------
// what one transfer's token looks like once the metadata is known.
export interface SHIT_1170_TRANSFER_TOKEN {
  // the token's display symbol.
  symbol: string;
  // the token's icon url, or null when it has none.
  icon: string | null;
  // how many decimals the raw amount is in.
  decimals: number;
  // the usd price of one whole token, or 0 when it is unknown.
  price_usd: number;
}
// ========================================
// ========================================
// --- PREFIXES --------------------------
// the prefixes a nep245 token id can carry.
//
// --- WHY --- a nep245 token id may point at ANOTHER contract's token:
// "nep141:wrap.near" means the multi token contract holds a token that
// IS the wrap.near ft, and "nep245:other.near:42" means it holds
// another multi token's token. the prefix says which lookup the id
// belongs to, and the icon and symbol follow it.
const SHIT_1170_NEP141_PREFIX = "nep141:";
const SHIT_1170_NEP245_PREFIX = "nep245:";
// ========================================
// ========================================
// --- HELPERS ---------------------------
// the contract id whose metadata describes a transfer.
//
// --- WHY THE NEAR CASE IS ITS OWN: a native transfer has no contract
// at all — it is the chain's own token, which the registry does not
// carry. the id "near" is what the token info reader understands it
// by, so that is what is asked for.
//
// --- WHY THE NEP245 PREFIX IS RESOLVED: a transfer whose token id
// says "nep141:wrap.near" is really a wrap.near ft. asking the multi
// token's own contract for it would find nothing, so the id inside the
// prefix is the contract that has the metadata.
function contract_of_fun(
  token_type: string,
  contract_id: string | undefined,
  token_id: string | undefined,
): string | null {
  if (token_type === "near") return SHIT_1170_NEAR_ID;
  if (contract_id === undefined || contract_id.length === 0) return null;
  if (token_type !== "nep245") return contract_id;
  if (token_id === undefined) return contract_id;
  if (token_id.startsWith(SHIT_1170_NEP141_PREFIX)) {
    const inner = token_id.slice(SHIT_1170_NEP141_PREFIX.length);
    // the id can be "contract" or "contract:label" — the contract is
    // what is before the first colon.
    const colon_at = inner.indexOf(":");
    return colon_at >= 0 ? inner.slice(0, colon_at) : inner;
  }
  if (token_id.startsWith(SHIT_1170_NEP245_PREFIX)) {
    const inner = token_id.slice(SHIT_1170_NEP245_PREFIX.length);
    const colon_at = inner.indexOf(":");
    return colon_at >= 0 ? inner.slice(0, colon_at) : inner;
  }
  return contract_id;
}
// ========================================
// ========================================
// --- COLLECT --------------------------
// every contract id a parsed transaction's transfers mention.
//
// --- WHY THE NFT TRANSFERS ARE INCLUDED: an nft transfer names its
// COLLECTION, and the collection's icon is what a reader recognises
// the nft by. the collection is a contract in the registry like any
// other token.
//
// --- WHY THE AMOUNTS ARE NOT DIVIDED HERE: the raw amount keeps its
// own decimals, and the metadata says what those decimals are. the
// two travel together.
export function transfer_contract_ids_fun(parsed: PARSE_RESULT): string[] {
  const ids: string[] = [];
  for (const transfer of parsed.transfers) {
    const id = contract_of_fun(
      transfer.token_type,
      transfer.contract_id,
      transfer.token_id,
    );
    if (id !== null) ids.push(id);
  }
  for (const transfer of parsed.nft_transfers) {
    if (transfer.contract_id.length > 0) ids.push(transfer.contract_id);
  }
  return ids;
}
// ========================================
// ========================================
// --- FETCH -----------------------------
// the metadata for every token a set of transfers mentions.
//
// --- WHY ONE CALL FOR THE WHOLE SET: the reader reads the token
// api once per set, and a transaction with three tokens is one request
// and not three. the api takes a list of ids.
//
// --- WHY A MISSING TOKEN IS NOT AN ERROR: a token the registry does
// not know is a token the reader gets the raw amount for, and that is
// what the app does everywhere else. a transaction is never hidden
// because one of its tokens is unknown.
export async function fetch_transfer_tokens_fun(
  parsed: PARSE_RESULT,
): Promise<Map<string, SHIT_1170_TRANSFER_TOKEN>> {
  const ids = [...new Set(transfer_contract_ids_fun(parsed))];
  return fetch_transfer_tokens_by_ids_fun(ids);
}

// the metadata for a list of contract ids.
//
// --- WHY THIS IS SEPARATE FROM THE PARSED VERSION: the account page
// shows five transactions at once, and their tokens are gathered into
// one list of ids and asked for together. so the by-ids call is the
// one that actually hits the api, and the parsed call is a wrapper
// over it.
export async function fetch_transfer_tokens_by_ids_fun(
  ids: ReadonlyArray<string>,
): Promise<Map<string, SHIT_1170_TRANSFER_TOKEN>> {
  const out = new Map<string, SHIT_1170_TRANSFER_TOKEN>();
  const wanted = [...new Set(ids)];
  if (wanted.length === 0) return out;
  let infos: Map<string, SHIT_1170_TOKEN_INFO_TYPE>;
  try {
    infos = await SHIT_1170_TOKEN_INFO.get(wanted);
  } catch {
    // --- WHY THE FAILURE IS SWALLOWED: the transfers are still worth
    // showing without their icons. a failure here costs the reader the
    // icon and the symbol, and it must not cost them the transaction.
    return out;
  }
  for (const [id, info] of infos) {
    out.set(id, {
      symbol: info.symbol,
      icon: info.icon,
      decimals: info.decimals,
      price_usd: info.price_usd,
    });
  }
  return out;
}
// ========================================
// ========================================
// --- LOOKUP ---------------------------
// the metadata for one transfer, or null when the token is unknown.
//
// --- WHY THIS IS ITS OWN FUNCTION: the lookup has to match what
// collect_contract_ids_fun collected, or a token that was fetched is
// not found. both go through contract_of_fun, so they cannot disagree.
export function transfer_token_of_fun(
  token_type: string,
  contract_id: string | undefined,
  token_id: string | undefined,
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>,
): SHIT_1170_TRANSFER_TOKEN | null {
  const id = contract_of_fun(token_type, contract_id, token_id);
  if (id === null) return null;
  return tokens.get(id) ?? null;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
