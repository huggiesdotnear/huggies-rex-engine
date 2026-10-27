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
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_PAGE_ACCOUNT_ID } from "../ts/page_account_id";
import { HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE } from "../ts/contract_page_pumpopoly_store";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS_FUN() {
  // --- WHY --- a revision counter forces a re-render when the store
  // lands; preact doesn't re-render from external state changes alone.
  const [, set_revision] = use_state(0);

  const account_id = HUGGIES_PAGE_ACCOUNT_ID.get_account_id();

  // the store owns the load. this component starts it once and
  // re-renders when it lands.
  use_effect(() => {
    if (account_id === null) return;
    const unsubscribe = HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    void HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE.load(account_id);
    return unsubscribe;
  }, [account_id]);

  // no account id and nobody signed in — there is no player to show.
  if (account_id === null) return <></>;

  const page_data = HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE.get_data();
  const player = page_data?.player ?? null;

  return (
    <>
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
        <article class="huggies-pumpopoly-card">
          <span class="huggies-pumpopoly-label">LAND</span>
          <strong class="huggies-pumpopoly-value">
            {player?.land_count ?? 0}
          </strong>
          <span class="huggies-pumpopoly-sub">IN-GAME PLOTS</span>
        </article>
        <article class="huggies-pumpopoly-card">
          <span class="huggies-pumpopoly-label">BOARD POSITION</span>
          <strong class="huggies-pumpopoly-value">
            {player?.location ?? 0}
          </strong>
          <span class="huggies-pumpopoly-sub">SQUARE</span>
        </article>
        <article class="huggies-pumpopoly-card">
          <span class="huggies-pumpopoly-label">CREDIT SCORE</span>
          <strong class="huggies-pumpopoly-value">
            {page_data?.credit_score ?? 0}
          </strong>
          <span class="huggies-pumpopoly-sub">LAND + INVITES</span>
        </article>
        <article class="huggies-pumpopoly-card">
          <span class="huggies-pumpopoly-label">INVITES</span>
          <strong class="huggies-pumpopoly-value">
            {player?.invites ?? 0}
          </strong>
          <span class="huggies-pumpopoly-sub">
            {player?.invitees ?? 0} INVITEES
          </span>
        </article>
        <article class="huggies-pumpopoly-card">
          <span class="huggies-pumpopoly-label">INVITED BY</span>
          <strong class="huggies-pumpopoly-text">
            {player?.invited_by || "NONE"}
          </strong>
        </article>
        <article class="huggies-pumpopoly-card">
          <span class="huggies-pumpopoly-label">LAST MOVE</span>
          <strong class="huggies-pumpopoly-text">
            {player?.last_move || "UNKNOWN"}
          </strong>
        </article>
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
    HUGGIES_PAGE_ACCOUNT_ID.init();
    render(<HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
