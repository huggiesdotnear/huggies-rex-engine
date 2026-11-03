// ========================================
// the intear dex page's header: the heading, the contract card and the
// dex's own numbers.
//
// the card is the one contract the page covers: `dex.intear.near`.
//
// this component does NOT fetch. the intear dex page has one loader
// (lib/ts/contract_page_intear_dex.ts); this reads its store
// (lib/ts/contract_page_intear_dex_store.ts).
// ========================================
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../../ts/shared/mount_ids";
import { SHIT_1170_CONTRACT_PAGE_INTEAR_DEX_STORE } from "../../../ts/contract/intear-dex/contract_page_intear_dex_store";
import { use_page_store_fun } from "../../../ts/shared/use_page_store";
import { compact_usd_fun } from "../../../ts/shared/compact_usd";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// --- WHY --- this id is a constant and not a fetched value: it is the
// contract the page is ABOUT, not something the api reports.
const SHIT_1170_INTEAR_DEX_CONTRACT_ID = "dex.intear.near";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function SHIT_1170_COMPONENT_CONTRACT_INTEAR_DEX_HEADER_FUN() {
  const page_data = use_page_store_fun(
    SHIT_1170_CONTRACT_PAGE_INTEAR_DEX_STORE,
  );
  const loading = SHIT_1170_CONTRACT_PAGE_INTEAR_DEX_STORE.is_loading();

  const pools = page_data?.pools ?? [];
  const pool_count = pools.length;
  const tvl_usd = page_data?.tvl_usd ?? 0;
  const volume_24h_usd = page_data?.volume_24h_usd ?? 0;

  return (
    <>
      <header>
        <h1>INTEAR DEX</h1>
      </header>
      <section class="contracts">
        <article>
          <span class="contract-label">DEX ENGINE</span>
          <strong class="contract-title">INTEAR DEX</strong>
          <code class="contract-id">{SHIT_1170_INTEAR_DEX_CONTRACT_ID}</code>
        </article>
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
const SELF_MOUNT_ID =
  SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_CONTRACT_INTEAR_DEX_HEADER;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<SHIT_1170_COMPONENT_CONTRACT_INTEAR_DEX_HEADER_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
