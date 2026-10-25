// ========================================
// shared smart-contract details page component.
// ========================================
import { render } from "preact";
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_AUTH } from "../ts/auth_status";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { list_contract_cards_fun } from "../ts/contract_cards";
import { load_rhea_amm_page_fun } from "../ts/rhea_amm_page";
import { load_rhea_dcl_page_fun } from "../ts/rhea_dcl_page";
import { load_intear_dex_page_fun } from "../ts/intear_dex_page";
import { load_sputnik_dao_page_fun } from "../ts/sputnik_dao_page";
import { load_pumpopoly_page_fun } from "../ts/pumpopoly_page";
import { list_trezu_treasuries_fun } from "../ts/trezu_treasuries";
import type { HUGGIES_RHEA_AMM_DATA } from "../ts/rhea_amm_page";
import type { HUGGIES_RHEA_DCL_DATA } from "../ts/rhea_dcl_page";
import type { HUGGIES_INTEAR_DATA } from "../ts/intear_dex_page";
import type { HUGGIES_SPUTNIK_DATA } from "../ts/sputnik_dao_page";
import type { HUGGIES_PUMPOPOLY_DATA } from "../ts/pumpopoly_page";
// ========================================
type HUGGIES_CONTRACT_KEY =
  "rhea-amm" | "rhea-dcl-v2" | "intear-dex" | "sputnik-dao" | "pumpopoly";
type HUGGIES_CONTRACT_DATA =
  | { kind: "rhea-amm"; data: HUGGIES_RHEA_AMM_DATA }
  | { kind: "rhea-dcl-v2"; data: HUGGIES_RHEA_DCL_DATA }
  | { kind: "intear-dex"; data: HUGGIES_INTEAR_DATA }
  | { kind: "sputnik-dao"; data: HUGGIES_SPUTNIK_DATA }
  | { kind: "pumpopoly"; data: HUGGIES_PUMPOPOLY_DATA };
// ========================================
// read the contract key from the page url.
function get_contract_key_fun(): HUGGIES_CONTRACT_KEY {
  if (typeof window === "undefined") return "rhea-amm";
  const key = new URLSearchParams(window.location.search).get("id");
  if (
    key === "rhea-amm" ||
    key === "rhea-dcl-v2" ||
    key === "intear-dex" ||
    key === "sputnik-dao" ||
    key === "pumpopoly"
  ) {
    return key;
  }
  return "rhea-amm";
}
// ========================================
// read the optional DAO contract id from the page url.
function get_dao_id_fun(): string {
  if (typeof window === "undefined") return "huggies.sputnik-dao.near";
  const id = new URLSearchParams(window.location.search).get("dao_id");
  return id?.trim() || "huggies.sputnik-dao.near";
}
// ========================================
// render a short metadata list.
function metadata_fun(
  rows: ReadonlyArray<[string, string]>,
): preact.JSX.Element {
  return (
    <dl class="huggies-contract-meta">
      {rows.map(([label, value]) => (
        <div>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
// ========================================
// render raw reserve rows grouped by DEX.
function pool_rows_fun(
  rows: ReadonlyArray<{
    dex: string;
    label: string;
    reserves: ReadonlyArray<readonly [string, string]>;
  }>,
): preact.JSX.Element {
  const dexes = [...new Set(rows.map((row) => row.dex))];
  return (
    <div class="huggies-contract-pools">
      {dexes.map((dex) => (
        <section>
          <h3>{dex}</h3>
          <div class="huggies-scroll">
            <table>
              <tbody>
                {rows
                  .filter((row) => row.dex === dex)
                  .map((row) => (
                    <tr>
                      <th scope="row">{row.label}</th>
                      <td>
                        {row.reserves.map(([token, amount]) => (
                          <span class="huggies-contract-reserve">
                            {token}: <code>{amount}</code>
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
// ========================================
// render the page for one contract and its loaded data.
function render_contract_fun(
  key: HUGGIES_CONTRACT_KEY,
  data: HUGGIES_CONTRACT_DATA | null,
  account_id: string | null,
  errors: string[],
): preact.JSX.Element {
  const cards = list_contract_cards_fun();
  const card = cards.find((item) => item.key === key);
  const heading = card?.title ?? key;
  const contract_id = card?.contract_id ?? "";

  if (data === null) {
    return (
      <section>
        <h1>{heading}</h1>
        <p>LOADING...</p>
      </section>
    );
  }

  if (data.kind === "rhea-amm") {
    const rows = data.data.pools.map((pool) => ({
      dex: pool.dex || "rhea-amm",
      label: `POOL ${pool.pool_id}`,
      reserves: pool.token_ids.map((token, index) => [
        token,
        pool.amounts[index] ?? "0",
      ]) as ReadonlyArray<readonly [string, string]>,
    }));
    return (
      <section>
        <h1>{heading}</h1>
        {metadata_fun([
          ["CONTRACT", contract_id],
          ["ACTIVE ACCOUNT", account_id ?? "NOT SIGNED IN"],
          ["POOL COUNT", `${data.data.pools.length} (SCOPE: FIRST 500)`],
        ])}
        <h2>POOLS / LIQUIDITY</h2>
        {pool_rows_fun(rows)}
        <h2>INTERNAL BALANCES</h2>
        {Object.entries(data.data.deposits).length === 0 ? (
          <p>NO INTERNAL BALANCES</p>
        ) : (
          <ul>
            {Object.entries(data.data.deposits).map(([token, amount]) => (
              <li>
                {token}: <code>{amount}</code>
              </li>
            ))}
          </ul>
        )}
        <h2>LP POSITIONS</h2>
        {Object.entries(data.data.shares).length === 0 ? (
          <p>NO LP POSITIONS</p>
        ) : (
          <ul>
            {Object.entries(data.data.shares).map(([pool_id, amount]) => (
              <li>
                POOL {pool_id}: <code>{amount}</code>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (data.kind === "rhea-dcl-v2") {
    const rows = data.data.pools.map((pool) => ({
      dex: "rhea-dcl-v2",
      label: pool.pool_id,
      reserves: [
        [pool.token_x, pool.total_x],
        [pool.token_y, pool.total_y],
      ] as ReadonlyArray<readonly [string, string]>,
    }));
    return (
      <section>
        <h1>{heading}</h1>
        {metadata_fun([
          ["CONTRACT", contract_id],
          ["ACTIVE ACCOUNT", account_id ?? "NOT SIGNED IN"],
          ["POOL COUNT", `${data.data.pools.length} (SCOPE: FIRST 500)`],
        ])}
        <h2>POOLS / LIQUIDITY</h2>
        {pool_rows_fun(rows)}
        <h2>INTERNAL BALANCES</h2>
        {Object.entries(data.data.assets).length === 0 ? (
          <p>NO INTERNAL BALANCES</p>
        ) : (
          <ul>
            {Object.entries(data.data.assets).map(([token, amount]) => (
              <li>
                {token}: <code>{amount}</code>
              </li>
            ))}
          </ul>
        )}
        <h2>LP POSITIONS</h2>
        {data.data.liquidities.length === 0 ? (
          <p>NO LP POSITIONS</p>
        ) : (
          <ul>
            {data.data.liquidities.map((liquidity, index) => (
              <li>
                <code>{JSON.stringify(liquidity)}</code>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (data.kind === "intear-dex") {
    const rows = data.data.pools.map((pool, index) => ({
      dex: "slimedragon.near/xyk",
      label: `POOL ${index} (${pool.kind})`,
      reserves: pool.assets.map((asset) => [
        asset.asset_id,
        asset.balance,
      ]) as ReadonlyArray<readonly [string, string]>,
    }));
    return (
      <section>
        <h1>{heading}</h1>
        {metadata_fun([
          ["CONTRACT", contract_id],
          ["LIVE POOL DEX", "slimedragon.near/xyk"],
          ["ACTIVE ACCOUNT", account_id ?? "NOT SIGNED IN"],
          ["POOL COUNT", `${data.data.pools.length} (SCOPE: FIRST 71)`],
        ])}
        <h2>POOLS / LIQUIDITY</h2>
        {pool_rows_fun(rows)}
        <h2>INTERNAL BALANCES</h2>
        {data.data.assets.length === 0 ? (
          <p>NO INTERNAL BALANCES</p>
        ) : (
          <ul>
            {data.data.assets.map((asset) => (
              <li>
                {asset.asset_id}: <code>{asset.balance}</code>
              </li>
            ))}
          </ul>
        )}
        <h2>LP POSITIONS</h2>
        {data.data.shares.length === 0 ? (
          <p>NO LP POSITIONS</p>
        ) : (
          <ul>
            {data.data.shares.map((amount, index) => (
              <li>
                POOL {index}: <code>{amount ?? "0"}</code>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (data.kind === "sputnik-dao") {
    return (
      <section>
        <h1>{heading}</h1>
        {metadata_fun([
          ["CONTRACT", get_dao_id_fun()],
          ["ACTIVE ACCOUNT", account_id ?? "NOT SIGNED IN"],
          ["NATIVE NEAR BALANCE", data.data.native_near_balance || "0"],
          ["AVAILABLE AMOUNT", data.data.available_amount || "0"],
          ["NAME", String(data.data.config.name ?? "UNKNOWN")],
        ])}
        <h2>MEMBERS / POLICY ROLES</h2>
        {data.data.roles.length === 0 ? (
          <p>NO POLICY ROLES</p>
        ) : (
          <ul>
            {data.data.roles.map((role) => (
              <li>
                <strong>{role.name}</strong>:{" "}
                {role.members.join(", ") || "NO GROUP"}
              </li>
            ))}
          </ul>
        )}
        <h2>PROPOSALS</h2>
        {data.data.proposals.length === 0 ? (
          <p>NO PROPOSALS</p>
        ) : (
          <ul>
            {data.data.proposals.map((proposal) => (
              <li>
                #{proposal.id} {proposal.status}: {proposal.description}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  const player = data.data.player;
  const invite_link =
    account_id === null
      ? ""
      : `https://near.pumpopoly.com/?invite=${encodeURIComponent(account_id)}`;
  return (
    <section>
      <h1>{heading}</h1>
      {metadata_fun([
        ["CONTRACT", contract_id],
        ["ACTIVE ACCOUNT", account_id ?? "NOT SIGNED IN"],
        ["LAND COUNT", String(player?.land_count ?? 0)],
        ["BOARD POSITION", String(player?.location ?? 0)],
        ["INVITES", String(player?.invites ?? 0)],
        ["INVITEES", String(player?.invitees ?? 0)],
        ["CREDIT SCORE", String(data.data.credit_score)],
        ["NFT COUNT", String(data.data.nft_count)],
        ["BALANCE", player?.balance ?? "0"],
      ])}
      <h2>ACCOUNT INFO</h2>
      <p>
        INVITED BY: {player?.invited_by || "NONE"} / LAST MOVE:{" "}
        {player?.last_move || "UNKNOWN"}
      </p>
      <h2>NFT HOLDINGS</h2>
      {data.data.nft_token_ids.length === 0 ? (
        <p>NO NFTS</p>
      ) : (
        <ul>
          {data.data.nft_token_ids.map((token_id) => (
            <li>{token_id}</li>
          ))}
        </ul>
      )}
      {invite_link !== "" && (
        <p>
          INVITE LINK: <a href={invite_link}>{invite_link}</a>
        </p>
      )}
    </section>
  );
}
// ========================================
// shared smart-contract page component.
function HUGGIES_COMPONENT_CONTRACT_PAGE_FUN() {
  const [data, set_data] = use_state<HUGGIES_CONTRACT_DATA | null>(null);
  const [account_id, set_account_id] = use_state<string | null>(null);
  const [errors, set_errors] = use_state<string[]>([]);
  const key = get_contract_key_fun();

  use_effect(() => {
    HUGGIES_AUTH.init();
    const unsubscribe = HUGGIES_AUTH.subscribe(() => {
      set_account_id(HUGGIES_AUTH.get_account_id());
    });
    set_account_id(HUGGIES_AUTH.get_account_id());
    return unsubscribe;
  }, []);

  use_effect(() => {
    let cancelled = false;
    set_data(null);
    const load = async (): Promise<HUGGIES_CONTRACT_DATA> => {
      if (key === "rhea-amm") {
        const value = await load_rhea_amm_page_fun(account_id);
        return { kind: key, data: value };
      }
      if (key === "rhea-dcl-v2") {
        const value = await load_rhea_dcl_page_fun(account_id);
        return { kind: key, data: value };
      }
      if (key === "intear-dex") {
        const value = await load_intear_dex_page_fun(account_id);
        return { kind: key, data: value };
      }
      if (key === "sputnik-dao") {
        const value = await load_sputnik_dao_page_fun(
          get_dao_id_fun(),
          account_id,
        );
        return { kind: key, data: value };
      }
      const value = await load_pumpopoly_page_fun(account_id);
      return { kind: key, data: value };
    };
    void load()
      .then((value) => {
        if (cancelled) return;
        set_data(value);
        set_errors(value.data.errors);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        set_errors([err instanceof Error ? err.message : String(err)]);
      });
    return () => {
      cancelled = true;
    };
  }, [key, account_id]);

  use_effect(() => {
    if (key !== "sputnik-dao" || account_id === null) return;
    void list_trezu_treasuries_fun(account_id)
      .then((treasuries) => {
        set_errors((current) => [
          ...current,
          `treasuries: ${treasuries
            .map((treasury) => {
              const name = treasury.config?.name;
              return name === undefined
                ? treasury.daoId
                : `${treasury.daoId} (${name})`;
            })
            .join(", ")}`,
        ]);
      })
      .catch((err: unknown) => {
        set_errors((current) => [
          ...current,
          `treasuries: ${err instanceof Error ? err.message : String(err)}`,
        ]);
      });
  }, [key, account_id]);

  return (
    <div class="huggies-contract-page">
      {render_contract_fun(key, data, account_id, errors)}
      {errors.length > 0 && (
        <details class="huggies-contract-errors">
          <summary>DATA LIMITATIONS</summary>
          <ul>
            {errors.map((error) => (
              <li>{error}</li>
            ))}
          </ul>
        </details>
      )}
      <nav class="huggies-contract-links" aria-label="smart contracts">
        {list_contract_cards_fun().map((card) => (
          <a href={card.route}>{card.title}</a>
        ))}
      </nav>
    </div>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_PAGE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_PAGE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
