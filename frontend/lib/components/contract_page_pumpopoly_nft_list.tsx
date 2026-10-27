// ========================================
// the NFTs a Pumpopoly player holds, from the nft contract.
//
// this component does NOT fetch. the Pumpopoly page has one loader
// (lib/ts/contract_page_pumpopoly.ts) and this component reads its
// result from the page store
// (lib/ts/contract_page_pumpopoly_store.ts).
//
// renders nothing when there is no account id — the page falls back to
// the signed-in account, and a signed-out visitor sees no nfts at all.
//
// mounts into
// <div id="HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_NFT_LIST">.
// ========================================
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_PAGE_ACCOUNT_ID } from "../ts/page_account_id";
import { HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE } from "../ts/contract_page_pumpopoly_store";
import { huggies_error_card_fun } from "./error_card";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_NFT_LIST_FUN() {
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
  const token_ids = page_data?.nft.token_ids ?? [];

  return (
    <>
      {huggies_error_card_fun({
        error: page_data?.errors.nfts ?? null,
        label: "NFTS",
        class_prefix: "huggies-pumpopoly",
      })}
      <h2>nft.pumpopoly.near</h2>
      <div class="huggies-pumpopoly-cards">
        <article class="huggies-pumpopoly-card">
          <span class="huggies-pumpopoly-label">NFTS HELD</span>
          <strong class="huggies-pumpopoly-value">
            {page_data?.nft.count ?? 0}
          </strong>
          <span class="huggies-pumpopoly-sub">PUMPOPOLY NFTS</span>
        </article>
      </div>
      {token_ids.length === 0 ? (
        <p>NO NFTS</p>
      ) : (
        <ul class="huggies-pumpopoly-nfts">
          {token_ids.map((token_id) => (
            <li>
              <code>{token_id}</code>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_NFT_LIST;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    HUGGIES_PAGE_ACCOUNT_ID.init();
    render(<HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_NFT_LIST_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
