// ========================================
// data loader for the Pumpopoly contract page.
//
// this is the page's ONLY loader. every fetch the Pumpopoly page makes
// happens in this file, and no component fetches anything — the
// components read the loaded data from
// lib/ts/contract_page_pumpopoly_store.ts. read this file and you know
// the page's requests.
//
// the shapes are parsed in lib/ts/contract_page_pumpopoly_parse.ts.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import { near_kit_contract_view_fun_json } from "../../../middleman/near_kit_tool_box";
import {
  parse_pumpopoly_player_fun,
  pumpopoly_credit_score_fun,
} from "./contract_page_pumpopoly_parse";
import type {
  HUGGIES_PUMPOPOLY_DATA,
  HUGGIES_PUMPOPOLY_ERRORS,
  HUGGIES_PUMPOPOLY_PLAYER,
} from "./contract_page_pumpopoly_parse";
// ========================================
// ========================================
// --- REQUESTS --------------------------
// the world contract: one player view.
// the nft contract: the player's token ids.
//
// they are two contracts, so they are two requests — they cannot be
// merged. they run in parallel, so the page is as slow as its slowest
// source, not the sum of both.
//
// a failing source is caught on its own and leaves the other one
// intact; the message lands in data.errors.
// ========================================
// ========================================
// --- LOAD ------------------------------
// load Pumpopoly player information and NFT holdings for one account.
export async function load_pumpopoly_page_fun(
  account_id: string | null,
): Promise<HUGGIES_PUMPOPOLY_DATA> {
  const errors: HUGGIES_PUMPOPOLY_ERRORS = { player: null, nfts: null };
  const near = near_kit_client();
  let player: HUGGIES_PUMPOPOLY_PLAYER | null = null;
  let nft_token_ids: string[] = [];

  if (account_id !== null) {
    try {
      player = parse_pumpopoly_player_fun(
        await near_kit_contract_view_fun_json<unknown>(
          near,
          "world.pumpopoly.near",
          "view_player",
          { account_id },
        ),
      );
    } catch (err) {
      errors.player = err instanceof Error ? err.message : String(err);
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
      errors.nfts = err instanceof Error ? err.message : String(err);
    }
  }
  const land_count = player?.land_count ?? 0;
  const invites = player?.invites ?? 0;
  return {
    player,
    nft: {
      count: nft_token_ids.length,
      token_ids: nft_token_ids,
    },
    credit_score: pumpopoly_credit_score_fun(land_count, invites),
    errors,
  };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
