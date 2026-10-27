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
// the list is one column of token ids in a table, capped in height and
// scrolled, so a player with hundreds of nfts does not push the rest of
// the page off screen.
//
// mounts into
// <div id="HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_NFT_LIST">.
// ========================================
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { ArrowDown, ArrowUp } from "lucide-preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_PAGE_ACCOUNT_ID } from "../ts/page_account_id";
import { HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE } from "../ts/contract_page_pumpopoly_store";
import { huggies_error_card_fun } from "./error_card";
import { huggies_stat_tile_fun } from "./stat_tile";
// ========================================
// ========================================
// --- SORT ------------------------------
// the sort direction of the nft list.
type HUGGIES_PUMPOPOLY_NFT_SORT_DIRECTION = "asc" | "desc";
// ========================================
// the default direction: smallest id first, so the list reads the way
// an id list normally does.
const HUGGIES_DEFAULT_NFT_SORT_DIRECTION: HUGGIES_PUMPOPOLY_NFT_SORT_DIRECTION =
  "asc";
// ========================================
// sort the token ids by their id.
//
// --- WHY --- the ids are compared as plain strings and not as numbers.
// a nft token id is a number, but it is carried as a string and can be
// long enough to lose precision as a number. comparing them as strings
// keeps the order stable and never rounds one away.
function sort_nft_token_ids_fun(
  token_ids: ReadonlyArray<string>,
  direction: HUGGIES_PUMPOPOLY_NFT_SORT_DIRECTION,
): string[] {
  const sorted = [...token_ids].sort((a, b) => {
    if (a === b) return 0;
    return a < b ? -1 : 1;
  });
  return direction === "desc" ? sorted.reverse() : sorted;
}
// ========================================
// ========================================
// --- SORT CONTROL ----------------------
// the direction toggle. the nft list has one thing to sort by — the
// token id — so it needs only a direction, not a row of sort keys.
//
// --- WHY --- this is its own control and not the shared
// sort_control.tsx. that one is welded to the token list's sort keys
// (volume, market cap) and its types, and the nft list sorts plain
// strings by id, which is a different thing.
function nft_sort_control_fun(props: {
  direction: HUGGIES_PUMPOPOLY_NFT_SORT_DIRECTION;
  on_direction: (direction: HUGGIES_PUMPOPOLY_NFT_SORT_DIRECTION) => void;
}): preact.JSX.Element {
  const Icon = props.direction === "desc" ? ArrowDown : ArrowUp;
  return (
    <div class="huggies-sort-control huggies-pumpopoly-nft-sort">
      <button
        type="button"
        class="huggies-sort-button is-active"
        aria-pressed="true"
        onClick={() =>
          props.on_direction(props.direction === "desc" ? "asc" : "desc")
        }
        aria-label={
          props.direction === "desc" ? "sort ascending" : "sort descending"
        }
        title={props.direction === "desc" ? "descending" : "ascending"}
      >
        <Icon size={13} />
        {props.direction === "desc" ? "DESC" : "ASC"}
      </button>
    </div>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_NFT_LIST_FUN() {
  // --- WHY --- a revision counter forces a re-render when the store
  // lands; preact doesn't re-render from external state changes alone.
  const [, set_revision] = use_state(0);
  const [direction, set_direction] =
    use_state<HUGGIES_PUMPOPOLY_NFT_SORT_DIRECTION>(
      HUGGIES_DEFAULT_NFT_SORT_DIRECTION,
    );

  const account_id = HUGGIES_PAGE_ACCOUNT_ID.get_account_id();

  // --- WHY --- the page's id can change under us: the page opened
  // signed out, so it had no player, and a later sign-in fills it in.
  // without this subscription the component would keep the old id and
  // never ask for the new player's nfts.
  use_effect(() => {
    const unsubscribe = HUGGIES_PAGE_ACCOUNT_ID.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

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
  const sorted = sort_nft_token_ids_fun(token_ids, direction);

  return (
    <>
      {huggies_error_card_fun({
        error: page_data?.errors.nfts ?? null,
        label: "NFTS",
        class_prefix: "huggies-pumpopoly",
      })}
      <h2>nft.pumpopoly.near</h2>
      <div class="huggies-pumpopoly-cards">
        {huggies_stat_tile_fun({
          label: "NFTS HELD",
          value: String(page_data?.nft.count ?? 0),
          sub: "PUMPOPOLY NFTS",
          class_prefix: "huggies-pumpopoly",
        })}
      </div>
      {token_ids.length === 0 ? (
        <p>NO NFTS</p>
      ) : (
        <>
          {nft_sort_control_fun({
            direction,
            on_direction: (next) => set_direction(next),
          })}
          <div class="huggies-pumpopoly-nft-scroll">
            <table class="huggies-pumpopoly-nft-table">
              <thead>
                <tr>
                  <th scope="col">TOKEN ID</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((token_id) => (
                  <tr>
                    <td>
                      <code>{token_id}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
