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
// the nfts are a GALLERY: one tile per token, showing the token's
// picture and its id. the pictures come from the same view call that
// brings the ids — the nft contract answers with the whole token, media
// included — so the gallery costs no extra request.
//
// the gallery is capped in height and scrolled, so a player with
// hundreds of nfts does not push the rest of the page off screen.
//
// mounts into
// <div id="HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_NFT_LIST">.
// ========================================
import { render } from "preact";
import { useState as use_state } from "preact/hooks";
import { ArrowDown, ArrowUp } from "lucide-preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE } from "../ts/contract_page_pumpopoly_store";
import { use_page_store_fun } from "../ts/use_page_store";
import { huggies_error_card_fun } from "./shared/error_card";
import { huggies_stat_tile_fun } from "./shared/stat_tile";
import type { HUGGIES_PUMPOPOLY_NFT } from "../ts/contract_page_pumpopoly_parse";
// ========================================
// ========================================
// --- SORT ------------------------------
// the sort direction of the nft gallery.
type HUGGIES_PUMPOPOLY_NFT_SORT_DIRECTION = "asc" | "desc";
// ========================================
// the default direction: smallest id first, so the list reads the way
// an id list normally does.
const HUGGIES_DEFAULT_NFT_SORT_DIRECTION: HUGGIES_PUMPOPOLY_NFT_SORT_DIRECTION =
  "asc";
// ========================================
// sort the nfts by their token id.
//
// --- WHY --- the ids are compared as plain strings and not as numbers.
// a nft token id is a number, but it is carried as a string and can be
// long enough to lose precision as a number. comparing them as strings
// keeps the order stable and never rounds one away.
function sort_pumpopoly_nfts_fun(
  nfts: ReadonlyArray<HUGGIES_PUMPOPOLY_NFT>,
  direction: HUGGIES_PUMPOPOLY_NFT_SORT_DIRECTION,
): HUGGIES_PUMPOPOLY_NFT[] {
  const sorted = [...nfts].sort((a, b) => {
    if (a.token_id === b.token_id) return 0;
    return a.token_id < b.token_id ? -1 : 1;
  });
  return direction === "desc" ? sorted.reverse() : sorted;
}
// ========================================
// --- SORT CONTROL ----------------------
// the direction toggle. the nft gallery has one thing to sort by — the
// token id — so it needs only a direction, not a row of sort keys.
//
// --- WHY --- this is its own control and not the shared
// sort_control.tsx. that one is welded to the token list's sort keys
// (volume, market cap) and its types, and the nft gallery sorts plain
// strings by id, which is a different thing.
function nft_sort_control_fun(props: {
  direction: HUGGIES_PUMPOPOLY_NFT_SORT_DIRECTION;
  on_direction: (direction: HUGGIES_PUMPOPOLY_NFT_SORT_DIRECTION) => void;
}): preact.JSX.Element {
  const Icon = props.direction === "desc" ? ArrowDown : ArrowUp;
  return (
    <div class="sort-control">
      <button
        type="button"
        class="sort-button is-active"
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
// --- TILE ------------------------------
// one nft: its picture and its id.
//
// --- WHY --- the picture is loaded lazily: a pumpopoly bond is a 1MB
// svg, so a player holding a few dozen of them would pull tens of
// megabytes of images for a gallery most of which is below the fold.
// lazy loading fetches the picture only when the tile is near the
// screen.
function nft_tile_fun(props: {
  nft: HUGGIES_PUMPOPOLY_NFT;
}): preact.JSX.Element {
  const nft = props.nft;
  return (
    <figure class="nft-tile" title={nft.title}>
      {nft.media !== null ? (
        <img
          class="nft-media"
          src={nft.media}
          alt={nft.title}
          loading="lazy"
          decoding="async"
        />
      ) : (
        // a token with no picture gets a placeholder, so the gallery
        // keeps its shape instead of showing a broken image.
        <span class="nft-media is-empty" aria-hidden="true" />
      )}
      <figcaption>
        <code>{nft.token_id}</code>
      </figcaption>
    </figure>
  );
}
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

  const page_data = use_page_store_fun(HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE);
  // --- WHY --- the id comes from the store: the store watches the id
  // and re-loads when it changes, so the components read one place for
  // both the id and the data, and they follow it.
  const account_id = HUGGIES_CONTRACT_PAGE_PUMPOPOLY_STORE.get_account_id();

  // no account id and nobody signed in — there is no player to show.
  if (account_id === null) return <></>;

  const nfts = page_data?.nft.nfts ?? [];
  const sorted = sort_pumpopoly_nfts_fun(nfts, direction);

  return (
    <>
      {huggies_error_card_fun({
        error: page_data?.errors.nfts ?? null,
        label: "NFTS",
        class_prefix: "pumpopoly",
      })}
      <h2>nft.pumpopoly.near</h2>
      <div class="cards">
        {huggies_stat_tile_fun({
          label: "NFTS HELD",
          value: String(page_data?.nft.count ?? 0),
          sub: "PUMPOPOLY NFTS",
          class_prefix: "pumpopoly",
        })}
      </div>
      {nfts.length === 0 ? (
        <p>NO NFTS</p>
      ) : (
        <>
          {nft_sort_control_fun({
            direction,
            on_direction: (next) => set_direction(next),
          })}
          <div class="nft-scroll">
            <div class="nft-gallery">
              {sorted.map((nft) => nft_tile_fun({ nft }))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_NFT_LIST;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_NFT_LIST_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
