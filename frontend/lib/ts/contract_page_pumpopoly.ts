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
import { generic_contract_view_fun_json } from "@near-kit-tool-box/fun";
import {
  parse_pumpopoly_nfts_fun,
  parse_pumpopoly_player_fun,
  pumpopoly_credit_score_fun,
} from "./contract_page_pumpopoly_parse";
import type {
  HUGGIES_PUMPOPOLY_DATA,
  HUGGIES_PUMPOPOLY_ERRORS,
  HUGGIES_PUMPOPOLY_NFT,
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
  let nfts: HUGGIES_PUMPOPOLY_NFT[] = [];

  if (account_id !== null) {
    try {
      player = parse_pumpopoly_player_fun(
        await generic_contract_view_fun_json<unknown>(
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
      // --- WHY --- the whole token is kept and not just its id: this one
      // call answers with the metadata too, media included, so the
      // gallery's pictures cost nothing extra. asking for the metadata
      // separately would be a request per token for data this response
      // already carries.
      nfts = parse_pumpopoly_nfts_fun(
        await generic_contract_view_fun_json<unknown>(
          near,
          "nft.pumpopoly.near",
          "nft_tokens_for_owner",
          {
            account_id,
            from_index: "0",
            limit: 500,
          },
        ),
      );
    } catch (err) {
      errors.nfts = err instanceof Error ? err.message : String(err);
    }
  }
  const land_count = player?.land_count ?? 0;
  const invites = player?.invites ?? 0;
  return {
    player,
    nft: {
      count: nfts.length,
      nfts,
    },
    credit_score: pumpopoly_credit_score_fun(land_count, invites),
    errors,
  };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
