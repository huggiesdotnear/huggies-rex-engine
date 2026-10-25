// ========================================
// data loader for the Pumpopoly contract page.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import { near_kit_contract_view_fun_json } from "../../../middleman/near_kit_tool_box";
// ========================================
const HUGGIES_PUMPOPOLY_UNIT = 1_000_000_000_000_000_000n;
// ========================================
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
export interface HUGGIES_PUMPOPOLY_DATA {
  player: HUGGIES_PUMPOPOLY_PLAYER | null;
  nft_count: number;
  nft_token_ids: string[];
  credit_score: number;
  errors: string[];
}
// ========================================
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
export function format_pumpopoly_balance_fun(raw: string): string {
  try {
    const amount = BigInt(raw);
    const whole = amount / HUGGIES_PUMPOPOLY_UNIT;
    const fraction = (amount % HUGGIES_PUMPOPOLY_UNIT)
      .toString()
      .padStart(18, "0")
      .replace(/0+$/, "");
    return fraction.length === 0
      ? whole.toLocaleString()
      : `${whole.toLocaleString()}.${fraction}`;
  } catch {
    return "0";
  }
}
// ========================================
// parse a Pumpopoly player view defensively.
function parse_player_fun(value: unknown): HUGGIES_PUMPOPOLY_PLAYER | null {
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
// load Pumpopoly player information and NFT holdings.
export async function load_pumpopoly_page_fun(
  account_id: string | null,
): Promise<HUGGIES_PUMPOPOLY_DATA> {
  const errors: string[] = [];
  const near = near_kit_client();
  let player: HUGGIES_PUMPOPOLY_PLAYER | null = null;
  let nft_token_ids: string[] = [];

  if (account_id !== null) {
    try {
      player = parse_player_fun(
        await near_kit_contract_view_fun_json<unknown>(
          near,
          "world.pumpopoly.near",
          "view_player",
          { account_id },
        ),
      );
    } catch (err) {
      errors.push(
        `player: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    try {
      const raw = await near_kit_contract_view_fun_json<
        Array<{ token_id?: unknown }>
      >(near, "nft.pumpopoly.near", "nft_tokens_for_owner", {
        account_id,
        from_index: "0",
        limit: 500,
      });
      nft_token_ids = raw
        .map((token) => token.token_id)
        .filter((token_id): token_id is string => typeof token_id === "string");
    } catch (err) {
      errors.push(`nfts: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  const land_count = player?.land_count ?? 0;
  const invites = player?.invites ?? 0;
  return {
    player,
    nft_count: nft_token_ids.length,
    nft_token_ids,
    credit_score: land_count * 10 + invites * 30,
    errors,
  };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
