// ========================================
// the rhea page's header: the heading, the two contract cards and the
// dex's own numbers.
//
// the two cards are the two rhea contracts the page covers:
//   v2.ref-finance.near  - the amm (ref finance v2)
//   dclv2.ref-labs.near  - the dcl v2 (ref labs)
//
// they are cards and not a list of ids because a reader who wants one
// of them wants to know WHICH one they are looking at, and a bare
// contract id does not say that.
//
// this component does NOT fetch. the rhea page has one loader
// (lib/ts/contract_page_rhea.ts) and this component reads its result
// from the page store (lib/ts/contract_page_rhea_store.ts).
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_CONTRACT_PAGE_RHEA_STORE } from "../ts/contract_page_rhea_store";
import { use_page_store_fun } from "../ts/use_page_store";
import { compact_usd_fun } from "../ts/compact_usd";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the two rhea contracts, as the header shows them.
//
// --- WHY --- these ids are a constant and not a fetched value: they
// are the two contracts the page is ABOUT, not something the api
// reports. the api reports the pools, not the contracts behind them.
const HUGGIES_RHEA_CONTRACTS: ReadonlyArray<{
  id: string;
  label: string;
  title: string;
  kind: string;
}> = [
  {
    id: "v2.ref-finance.near",
    label: "AMM",
    title: "Ref Finance v2",
    kind: "classic",
  },
  {
    id: "dclv2.ref-labs.near",
    label: "DCL V2",
    title: "Ref Labs",
    kind: "dcl",
  },
];
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_RHEA_HEADER_FUN() {
  const page_data = use_page_store_fun(HUGGIES_CONTRACT_PAGE_RHEA_STORE);
  const loading = HUGGIES_CONTRACT_PAGE_RHEA_STORE.is_loading();

  // the numbers the header shows. the tvl and the volume are the dex's
  // own totals, over every pool the indexer knows — not the sum of the
  // rows on screen, which is one page of one sort.
  const pool_count = page_data?.total ?? 0;
  const tvl_usd = page_data?.tvl_usd ?? 0;
  const volume_24h_usd = page_data?.volume_24h_usd ?? 0;

  return (
    <>
      <header>
        <h1>Rhea</h1>
        <p>the rhea dexes on near — the amm and the dcl</p>
      </header>
      <section class="contracts">
        {HUGGIES_RHEA_CONTRACTS.map((contract) => (
          <article key={contract.id}>
            <span class="contract-label">{contract.label}</span>
            <strong class="contract-title">{contract.title}</strong>
            <code class="contract-id">{contract.id}</code>
          </article>
        ))}
      </section>
      <section class="stats">
        <div>
          <strong>{pool_count.toLocaleString()}</strong>
          <span>POOLS</span>
        </div>
        <div>
          <strong>{compact_usd_fun(tvl_usd)}</strong>
          <span>TVL</span>
        </div>
        <div>
          <strong>{compact_usd_fun(volume_24h_usd)}</strong>
          <span>24H VOLUME</span>
        </div>
        {loading && (
          <div>
            <strong>...</strong>
            <span>LOADING</span>
          </div>
        )}
      </section>
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_RHEA_HEADER;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_RHEA_HEADER_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
