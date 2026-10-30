// ========================================
// known-holder classification for the SHIT token.
//
// LOCAL COPY of `@huggies/shit-bin`'s `KNOWN_HOLDERS_ACCOUNTS` — that
// package is not a dependency of this repo yet, so the canonical map
// lives here instead.
//
// --- SYNC SOURCE ---
// /home/sleet-dev/SLEET_AI_WORKING_DIRECTORY/shit-bin/src/const/mainnet/HOLDERS.ts
// keep this file exactly in sync with that source.
// ========================================
export type HUGGIES_SHIT_HOLDER_TYPE = "dev" | "dex" | "vault" | "nft" | "burn";

// the type shown for a holder that is not in the map below.
export const HUGGIES_SHIT_HOLDER_TYPE_REGULAR = "regular" as const;
export type HUGGIES_SHIT_HOLDER_ROW_TYPE =
  HUGGIES_SHIT_HOLDER_TYPE | typeof HUGGIES_SHIT_HOLDER_TYPE_REGULAR;
// ========================================
const KNOWN_HOLDERS_ACCOUNTS: Record<string, HUGGIES_SHIT_HOLDER_TYPE> = {
  "sleet.near": "dev",
  "vault.huggies.near": "vault",
  "growth.huggies.near": "vault",
  "future.huggies.near": "vault",
  "diaper.huggies.near": "vault",
  "baby.huggies.near": "vault",
  "huggies.sputnik-dao.near": "vault",
  "ref.huggies.near": "vault",
  // "shitbyhuggies.tipbot.intear.near": "vault",
  "huggies.near": "vault",
  "sleet_mainnet_test_yes_doxing_myself_sorry_for_rugs.near": "dev",
  "nonresistant.near": "dev",
  "nonresistantreally.tg": "dev",
  "frozen_bot2.user.intear.near": "dev",
  // "rug-testing.near": "dev", i do not own this account
  "v2.ref-finance.near": "dex",
  "veax.near": "dex",
  "dex.intear.near": "dex",
  "meme-cooking.near": "dex",
  // nft
  "notdone.near": "nft",
  "outwit.near": "nft",
  "fediverse.near": "nft",
  "waffel.near": "nft",
  "utes.near": "nft",
  "powwow.near": "nft",
  "nearnexus.near": "nft",
  "hodldogshit.near": "nft",
  "sofo.near": "nft",
  "jeetersnotallowed.near": "nft",
  "ironclaw.near": "nft",
  "chicago.near": "nft",
  "near-social-js.near": "nft",
  "burn.sleet.near": "burn",
};
// ========================================
// classify one account id, falling back to the regular holder type.
export function shit_holder_type_fun(
  account_id: string,
): HUGGIES_SHIT_HOLDER_ROW_TYPE {
  return KNOWN_HOLDERS_ACCOUNTS[account_id] ?? HUGGIES_SHIT_HOLDER_TYPE_REGULAR;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
