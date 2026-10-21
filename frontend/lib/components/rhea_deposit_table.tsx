// ========================================
// the account's rhea (ref finance v2) deposits: tokens the account has
// deposited into the rhea contract on its own behalf.
// --- WHY --- this is DEPOSITS, not LP positions. a deposit is a plain
// token balance held by rhea for the account; it earns no share of a pool
// and carries no position. intear's "rhea" BALANCE SOURCE is a different
// thing (pool/LP holdings) and is not what this reads.
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { near_kit_client, getStoredNetworkId } from "@near-kit-tool-box/web";
import * as HUGGIES_NEAR_FUN from "@near-kit-tool-box/fun";
import { rhea_ammv2_get_deposits_fun_json } from "@near-kit-tool-box/fun";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_ACCOUNT_ID } from "../ts/account_id";
import { HUGGIES_TOKEN_INFO } from "../ts/token_info";
import { HUGGIES_AMOUNT_FORMAT } from "../ts/token_amount_format";
import type { HUGGIES_TOKEN_INFO as TOKEN_INFO } from "../ts/token_info";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the rhea (ref finance v2) contract for the selected network.
// --- WHY --- this calls the tool box's own rhea_ammv2_contractid, but
// through a cast: @near-kit-tool-box/fun@0.2.0 ships a
// contract_id_const_type.d.ts containing no type definitions at all
// (an empty export plus a source map), so NETWORK_ID resolves to
// unknown and the call will not typecheck. the cast is confined to this
// one line. delete it once the published types are fixed.
function rhea_contract_id_fun(): string {
  const contractid = HUGGIES_NEAR_FUN.rhea_ammv2_contractid as (
    network: "mainnet" | "testnet",
  ) => string;
  return contractid(getStoredNetworkId());
}
// ========================================
// ========================================
// --- FETCH -----------------------------
// read one account's rhea deposits and resolve each token's metadata.
// --- WHY --- balances come back as a `{ token_id: balance }` map in the
// token's smallest unit, exactly like intear's, so the shared
// token_info + amount formatter apply unchanged. keys with a "0" balance
// are tokens the account touched once and are not deposits.
async function fetch_deposit_entries_fun(
  account_id: string,
): Promise<ReadonlyArray<{ id: string; raw: string; info: TOKEN_INFO }>> {
  const near = near_kit_client();
  // --- WHY --- the cast is a workaround for a bug in the published
  // @near-kit-tool-box/fun@0.2.0 build: rhea_ammv2_get_deposits is
  // declared as returning Promise<unknown> because its annotation pulls
  // in NETWORK_ID/RHEA_AMMV2_GET_DEPOSITS_TYPE from a d.ts that ships
  // with no type definitions. the real return is
  // `{ [token_id: string]: balance_string }` (confirmed against
  // mainnet), which is what is restored here. drop the cast once the
  // package's types are fixed.
  const get_deposits = rhea_ammv2_get_deposits_fun_json as (
    near: unknown,
    contractId: string,
    account: string,
  ) => Promise<{ [token_id: string]: string }>;
  const deposits = await get_deposits(
    near,
    rhea_contract_id_fun(),
    account_id,
  );

  const nonzero = Object.entries(deposits).filter(([, raw]) => raw !== "0");
  if (nonzero.length === 0) return [];

  const info_map = await HUGGIES_TOKEN_INFO.get(nonzero.map(([id]) => id));
  const out: Array<{ id: string; raw: string; info: TOKEN_INFO }> = [];
  for (const [id, raw] of nonzero) {
    const info = info_map.get(id);
    if (info === undefined) continue;
    out.push({ id, raw, info });
  }
  // biggest deposit first.
  out.sort(
    (a, b) =>
      HUGGIES_AMOUNT_FORMAT.balance_usd(b.raw, b.info) -
      HUGGIES_AMOUNT_FORMAT.balance_usd(a.raw, a.info),
  );
  return out;
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_RHEA_DEPOSIT_TABLE_FUN() {
  // ========================================
  const [rows, set_rows] = use_state<
    ReadonlyArray<{ id: string; raw: string; info: TOKEN_INFO }> | null
  >(null);
  const [error, set_error] = use_state<string | null>(null);

  const account_id = HUGGIES_ACCOUNT_ID.get_account_id();

  use_effect(() => {
    if (account_id === null) {
      set_rows(null);
      set_error(null);
      return;
    }
    let cancelled = false;
    set_error(null);
    void fetch_deposit_entries_fun(account_id)
      .then((result) => {
        if (cancelled) return;
        set_rows(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        set_rows(null);
        set_error(message);
        console.warn("[rhea_deposit_table] deposits fetch failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, [account_id]);

  // no `?id=` on this url — render nothing.
  if (account_id === null) return <></>;
  // still loading, or the account has no deposits at all: render nothing,
  // so an account that never used rhea sees no empty section.
  if (error === null && (rows === null || rows.length === 0)) return <></>;

  return (
    <>
      <h2 class="huggies-section-title">RHEA DEPOSITS</h2>
      {error !== null ? (
        <p data-huggies-rhea-error={error}>{error}</p>
      ) : (
        <div class="huggies-scroll">
          <table data-huggies-rhea-account={account_id}>
            <tbody>
              {rows?.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div class="huggies-row-head">
                      {row.info.icon === null ? (
                        <span
                          class="huggies-token-icon huggies-token-icon--empty"
                          aria-hidden="true"
                        />
                      ) : (
                        <img
                          class="huggies-token-icon"
                          src={row.info.icon}
                          alt=""
                          width={20}
                          height={20}
                          loading="lazy"
                        />
                      )}
                      <span class="huggies-ticker">{row.info.symbol}</span>
                      <span class="huggies-amounts">
                        <span class="huggies-amount">
                          {HUGGIES_AMOUNT_FORMAT.balance(row.raw, row.info)}
                        </span>
                        <span class="huggies-usd">
                          {HUGGIES_AMOUNT_FORMAT.usd(
                            HUGGIES_AMOUNT_FORMAT.balance_usd(row.raw, row.info),
                          )}
                        </span>
                      </span>
                    </div>
                    <div class="huggies-contract" title={row.id}>
                      {row.id}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_RHEA_DEPOSIT_TABLE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    HUGGIES_ACCOUNT_ID.init();
    render(<HUGGIES_COMPONENT_RHEA_DEPOSIT_TABLE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================