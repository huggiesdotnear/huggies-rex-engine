// ========================================
// the account's rhea amm (ref finance v2) balances: tokens the account
// has deposited into the rhea contract on its own behalf.
// --- WHY --- this is BALANCES, not LP positions. a deposit is a plain
// token balance held by rhea for the account; it earns no share of a pool
// and carries no position. intear's "rhea" BALANCE SOURCE is a different
// thing (pool/LP holdings) and is not what this reads.
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { near_kit_client } from "@near-kit-tool-box/web";
import {
  rhea_ammv2_get_deposits_fun_json,
  rhea_ammv2_contractid,
} from "@near-kit-tool-box/fun";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_ACCOUNT_ID } from "../ts/account_id";
import { HUGGIES_TOKEN_INFO } from "../ts/token_info";
import { HUGGIES_AMOUNT_FORMAT } from "../ts/token_amount_format";
import { HUGGIES_NETWORK } from "../ts/network";
import { huggies_balance_row_fun } from "../ts/balance_row";
import type { HUGGIES_TOKEN_INFO as TOKEN_INFO } from "../ts/token_info";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the rhea (ref finance v2) contract for this app's network.
// --- WHY --- the network is pinned to mainnet (lib/ts/network.ts),
// so this is the mainnet contract. the helper still takes a network
// argument because the contract ids differ per network.
function rhea_contract_id_fun(): string {
  return rhea_ammv2_contractid(HUGGIES_NETWORK);
}
// ========================================
// ========================================
// --- FETCH -----------------------------
// read one account's rhea amm balances and resolve each token's metadata.
// --- WHY --- balances come back as a `{ token_id: balance }` map in the
// token's smallest unit, exactly like intear's, so the shared
// token_info + amount formatter apply unchanged. keys with a "0" balance
// are tokens the account touched once and are not deposits.
async function fetch_balance_entries_fun(
  account_id: string,
): Promise<ReadonlyArray<{ id: string; raw: string; info: TOKEN_INFO }>> {
  const near = near_kit_client();
  const deposits = await rhea_ammv2_get_deposits_fun_json(
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
  // biggest balance first.
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
function HUGGIES_COMPONENT_ACCOUNT_RHEA_AMM_BALANCE_TABLE_FUN() {
  // ========================================
  const [rows, set_rows] = use_state<ReadonlyArray<{
    id: string;
    raw: string;
    info: TOKEN_INFO;
  }> | null>(null);
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
    void fetch_balance_entries_fun(account_id)
      .then((result) => {
        if (cancelled) return;
        set_rows(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        set_rows(null);
        set_error(message);
        console.warn("[account_rhea_amm_balance_table] balances fetch failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, [account_id]);

  // no `?id=` on this url — render nothing.
  if (account_id === null) return <></>;
  // still loading, or the account has no balances at all: render nothing,
  // so an account that never used rhea sees no empty section.
  if (error === null && (rows === null || rows.length === 0)) return <></>;

  return (
    <>
      <h2 class="huggies-section-title">RHEA AMM BALANCE</h2>
      {error !== null ? (
        <p data-huggies-rhea-amm-error={error}>{error}</p>
      ) : (
        <div class="huggies-scroll">
          <table data-huggies-rhea-amm-account={account_id}>
            <tbody>
              {rows?.map((row) =>
                huggies_balance_row_fun({
                  id: row.id,
                  raw: row.raw,
                  info: row.info,
                }),
              )}
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
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_ACCOUNT_RHEA_AMM_BALANCE_TABLE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    HUGGIES_ACCOUNT_ID.init();
    render(<HUGGIES_COMPONENT_ACCOUNT_RHEA_AMM_BALANCE_TABLE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
