// ========================================
// the Pumpopoly contract's shapes, and how a raw contract view turns
// into them.
//
// the contract is not ours, so every field is read defensively: a
// missing or oddly typed field becomes a zero or an empty string
// rather than an exception that blanks the page.
//
// these live apart from the loader so the page's request list is
// knowable by reading one file (lib/ts/contract_page_pumpopoly.ts).
// ========================================
// ========================================
// --- WHY --- the Pumpopoly token has 24 decimals, so one unit is
// 1e24. dividing by 1e18 showed a balance a million times too big.
// ========================================
const HUGGIES_PUMPOPOLY_UNIT = 1_000_000_000_000_000_000_000_000n;
const HUGGIES_PUMPOPOLY_DECIMALS = 24;
// ========================================
// ========================================
// --- SHAPES -----------------------------
export interface HUGGIES_PUMPOPOLY_PLAYER {
  land_count: number;
  location: number;
  balance: string;
  balance_human: string;
  account_id: string;
  invites: number;
  invitees: number;
  invited_by: string;
  last_move: string;
}
// ========================================
// one nft, as the gallery shows it.
//
// --- WHY --- the nft contract's `nft_tokens_for_owner` view answers
// with the WHOLE token, metadata and all, so there is no second call to
// make for the image. the metadata is read here and the media url is
// kept, because the gallery needs the picture and not only the id.
//
// --- WHY --- `media` is nullable: the contract makes it optional, and a
// token with no media has to render as a tile without a picture, not as
// a broken image.
export interface HUGGIES_PUMPOPOLY_NFT {
  token_id: string;
  title: string;
  description: string;
  media: string | null;
}
export interface HUGGIES_PUMPOPOLY_NFT_DATA {
  count: number;
  nfts: HUGGIES_PUMPOPOLY_NFT[];
}
// ========================================
export interface HUGGIES_PUMPOPOLY_DATA {
  player: HUGGIES_PUMPOPOLY_PLAYER | null;
  nft: HUGGIES_PUMPOPOLY_NFT_DATA;
  credit_score: number;
  errors: HUGGIES_PUMPOPOLY_ERRORS;
}
// ========================================
// the errors, one per source.
//
// --- WHY --- keyed by source rather than one flat list: each part of
// the page depends on exactly one source, and a component that shows a
// source's data says so right there when that source failed. a flat
// list of strings could not be told apart that way — the reader
// would see zeros and not know whether the player has no land or the
// contract could not be reached.
export interface HUGGIES_PUMPOPOLY_ERRORS {
  // the world contract call failed.
  player: string | null;
  // the nft contract call failed.
  nfts: string | null;
}
// ========================================
// ========================================
// --- PARSE ------------------------------
// parse a non-negative integer defensively.
function parse_count_fun(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : 0;
  }
  return 0;
}
// ========================================
// format a Pumpopoly base-unit balance as a human-readable amount.
function format_pumpopoly_balance_fun(raw: string): string {
  try {
    const amount = BigInt(raw);
    const negative = amount < 0n;
    const magnitude = negative ? -amount : amount;
    const whole = magnitude / HUGGIES_PUMPOPOLY_UNIT;
    const fraction = (magnitude % HUGGIES_PUMPOPOLY_UNIT)
      .toString()
      .padStart(HUGGIES_PUMPOPOLY_DECIMALS, "0")
      .replace(/0+$/, "");
    const sign = negative ? "-" : "";
    return fraction.length === 0
      ? `${sign}${whole.toLocaleString()}`
      : `${sign}${whole.toLocaleString()}.${fraction}`;
  } catch {
    return "0";
  }
}
// ========================================
// parse a Pumpopoly player view defensively.
export function parse_pumpopoly_player_fun(
  value: unknown,
): HUGGIES_PUMPOPOLY_PLAYER | null {
  if (typeof value !== "object" || value === null) return null;
  const player = value as Partial<HUGGIES_PUMPOPOLY_PLAYER>;
  if (typeof player.account_id !== "string") return null;
  const balance = typeof player.balance === "string" ? player.balance : "0";
  return {
    land_count: parse_count_fun(player.land_count),
    location: parse_count_fun(player.location),
    balance,
    balance_human: format_pumpopoly_balance_fun(balance),
    account_id: player.account_id,
    invites: parse_count_fun(player.invites),
    invitees: parse_count_fun(player.invitees),
    invited_by: typeof player.invited_by === "string" ? player.invited_by : "",
    last_move: typeof player.last_move === "string" ? player.last_move : "",
  };
}
// ========================================
// --- NFT PARSE --------------------------
// parse the nft contract's token list defensively.
//
// --- WHY --- the shape is read field by field and never trusted: the
// contract is not ours, and one odd token must not blank the whole
// gallery. a token with no usable id is dropped; a token with no media
// is kept, because the id alone is still worth showing.
export function parse_pumpopoly_nfts_fun(
  value: unknown,
): HUGGIES_PUMPOPOLY_NFT[] {
  if (!Array.isArray(value)) return [];
  const nfts: HUGGIES_PUMPOPOLY_NFT[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) continue;
    const token = raw as {
      token_id?: unknown;
      metadata?: { title?: unknown; description?: unknown; media?: unknown };
    };
    // --- WHY --- the id is required and everything else is not: a token
    // without an id cannot be named, sorted or linked, so it is nothing.
    if (typeof token.token_id !== "string" || token.token_id.length === 0) {
      continue;
    }
    const metadata = token.metadata ?? {};
    nfts.push({
      token_id: token.token_id,
      title:
        typeof metadata.title === "string" && metadata.title.length > 0
          ? metadata.title
          : token.token_id,
      description:
        typeof metadata.description === "string" ? metadata.description : "",
      media:
        typeof metadata.media === "string" && metadata.media.length > 0
          ? metadata.media
          : null,
    });
  }
  return nfts;
}
// ========================================
// the credit score: land is worth 10 and an invite is worth 30. it is
// computed here, not read from the contract, because the contract does
// not store it.
export function pumpopoly_credit_score_fun(
  land_count: number,
  invites: number,
): number {
  return land_count * 10 + invites * 30;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
