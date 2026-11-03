// ========================================
// the player's Pumpopoly stats: the in-game balance and the six cards from
// the world contract.
//
// this component does NOT fetch. the Pumpopoly page has one loader
// (lib/ts/contract_page_pumpopoly.ts); this reads its store
// (lib/ts/contract_page_pumpopoly_store.ts).
//
// renders nothing when there is no account id — the page falls back to
// the signed-in account, and a signed-out visitor sees no stats.
//
// mounts into
// <div id="SHIT_1170_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS">.
// ========================================
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../../ts/shared/mount_ids";
import { SHIT_1170_CONTRACT_PAGE_PUMPOPOLY_STORE } from "../../../ts/contract/pumpopoly/contract_page_pumpopoly_store";
import { use_page_store_fun } from "../../../ts/shared/use_page_store";
import { shit_1170_error_card_fun } from "./error_card";
import { shit_1170_stat_tile_fun } from "./stat_tile";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function SHIT_1170_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS_FUN() {
  const page_data = use_page_store_fun(SHIT_1170_CONTRACT_PAGE_PUMPOPOLY_STORE);
  // --- WHY --- the id comes from the store: it watches the id and
  // re-loads when it changes, so the id and the data change together.
  const account_id = SHIT_1170_CONTRACT_PAGE_PUMPOPOLY_STORE.get_account_id();

  // no account id and nobody signed in — there is no player to show.
  if (account_id === null) return <></>;

  const player = page_data?.player ?? null;

  return (
    <>
      {shit_1170_error_card_fun({
        error: page_data?.errors.player ?? null,
        label: "PLAYER DATA",
        class_prefix: "pumpopoly",
      })}
      <h2>world.pumpopoly.near</h2>
      <div class="balance">
        <span class="label">IN-GAME BALANCE</span>
        <strong class="balance-value">{player?.balance_human ?? "0"}</strong>
        <span class="sub">PUMPOPOLY TOKENS</span>
        {player !== null && <code class="raw">{player.balance}</code>}
      </div>
      <div class="cards">
        {shit_1170_stat_tile_fun({
          label: "LAND",
          value: String(player?.land_count ?? 0),
          sub: "IN-GAME PLOTS",
          class_prefix: "pumpopoly",
        })}
        {shit_1170_stat_tile_fun({
          label: "BOARD POSITION",
          value: String(player?.location ?? 0),
          sub: "SQUARE",
          class_prefix: "pumpopoly",
        })}
        {shit_1170_stat_tile_fun({
          label: "CREDIT SCORE",
          value: String(page_data?.credit_score ?? 0),
          sub: "LAND + INVITES",
          class_prefix: "pumpopoly",
        })}
        {shit_1170_stat_tile_fun({
          label: "INVITES",
          value: String(player?.invites ?? 0),
          sub: `${player?.invitees ?? 0} INVITEES`,
          class_prefix: "pumpopoly",
        })}
        {shit_1170_stat_tile_fun({
          label: "INVITED BY",
          value: player?.invited_by || "NONE",
          sub: null,
          class_prefix: "pumpopoly",
          is_text: true,
        })}
        {shit_1170_stat_tile_fun({
          label: "LAST MOVE",
          value: player?.last_move || "UNKNOWN",
          sub: null,
          class_prefix: "pumpopoly",
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
  SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<SHIT_1170_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
