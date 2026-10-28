// ========================================
// the player's Pumpopoly stats: the in-game balance and the six cards
// from the world contract.
//
// this component does NOT fetch. the Pumpopoly page has one loader
// (lib/ts/contract_page_pumpopoly.ts) and this component reads its
// result from the page store
// (lib/ts/contract_page_pumpopoly_store.ts).
//
// renders nothing when there is no account id — the page falls back to
// the signed-in account, and a signed-out visitor sees no stats at all.
//
// mounts into
// <div id="HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS">.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE } from "../ts/contract_page_pumpopoly_store";
import { use_page_store_fun } from "../ts/use_page_store";
import { huggies_error_card_fun } from "./error_card";
import { huggies_stat_tile_fun } from "./stat_tile";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS_FUN() {
  const page_data = use_page_store_fun(HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE);
  // --- WHY --- the id comes from the store: the store watches the id
  // and re-loads when it changes, so the components read one place for
  // both the id and the data, and they follow it.
  const account_id = HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE.get_account_id();

  // no account id and nobody signed in — there is no player to show.
  if (account_id === null) return <></>;

  const player = page_data?.player ?? null;

  return (
    <>
      {huggies_error_card_fun({
        error: page_data?.errors.player ?? null,
        label: "PLAYER DATA",
        class_prefix: "huggies-pumpopoly",
      })}
      <h2>world.pumpopoly.near</h2>
      <div class="huggies-pumpopoly-balance">
        <span class="huggies-pumpopoly-label">IN-GAME BALANCE</span>
        <strong class="huggies-pumpopoly-balance-value">
          {player?.balance_human ?? "0"}
        </strong>
        <span class="huggies-pumpopoly-sub">PUMPOPOLY TOKENS</span>
        {player !== null && (
          <code class="huggies-pumpopoly-raw">{player.balance}</code>
        )}
      </div>
      <div class="huggies-pumpopoly-cards">
        {huggies_stat_tile_fun({
          label: "LAND",
          value: String(player?.land_count ?? 0),
          sub: "IN-GAME PLOTS",
          class_prefix: "huggies-pumpopoly",
        })}
        {huggies_stat_tile_fun({
          label: "BOARD POSITION",
          value: String(player?.location ?? 0),
          sub: "SQUARE",
          class_prefix: "huggies-pumpopoly",
        })}
        {huggies_stat_tile_fun({
          label: "CREDIT SCORE",
          value: String(page_data?.credit_score ?? 0),
          sub: "LAND + INVITES",
          class_prefix: "huggies-pumpopoly",
        })}
        {huggies_stat_tile_fun({
          label: "INVITES",
          value: String(player?.invites ?? 0),
          sub: `${player?.invitees ?? 0} INVITEES`,
          class_prefix: "huggies-pumpopoly",
        })}
        {huggies_stat_tile_fun({
          label: "INVITED BY",
          value: player?.invited_by || "NONE",
          sub: null,
          class_prefix: "huggies-pumpopoly",
          is_text: true,
        })}
        {huggies_stat_tile_fun({
          label: "LAST MOVE",
          value: player?.last_move || "UNKNOWN",
          sub: null,
          class_prefix: "huggies-pumpopoly",
          is_text: true,
        })}
      </div>
    </>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
