// ========================================
// shared smart-contract details page component.
// ========================================
import { render } from "preact";
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_AUTH } from "../ts/auth_status";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import {
  contract_page_href_fun,
  list_contract_cards_fun,
} from "../ts/contract_cards";
import { load_rhea_amm_page_fun } from "../ts/rhea_amm_page";
import { load_rhea_dcl_page_fun } from "../ts/rhea_dcl_page";
import { load_intear_dex_page_fun } from "../ts/intear_dex_page";
import { load_sputnik_dao_page_fun } from "../ts/sputnik_dao_page";
import { load_pumpopoly_page_fun } from "../ts/pumpopoly_page";
import { load_dao_account_balances_fun } from "../ts/dao_account_balance";
import { list_trezu_treasuries_fun } from "../ts/trezu_treasuries";
import { filter_pools_fun, pool_summary_fun } from "../ts/contract_pool_stats";
import { current_app_depth_fun } from "../ts/app_depth";
import { token_detail_href_fun } from "../ts/token_link";
import { HUGGIES_AMOUNT_FORMAT } from "../ts/token_amount_format";
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
const HUGGIES_DEFAULT_DAO_ID = "sputnik-dao.near";
// ========================================
// narrow an arbitrary string to a known contract key.
function as_contract_key_fun(
  value: string | null,
): HUGGIES_CONTRACT_KEY | null {
  if (value === null) return null;
  if (
    value === "rhea-amm" ||
    value === "rhea-dcl-v2" ||
    value === "intear-dex" ||
    value === "sputnik-dao" ||
    value === "pumpopoly"
  ) {
    return value;
  }
  return null;
}
// ========================================
// read the contract key from the mount element's data-contract attribute.
function get_contract_key_fun(): HUGGIES_CONTRACT_KEY {
  if (typeof window === "undefined") return "rhea-amm";
  const el = document.getElementById(
    HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_PAGE,
  );
  const from_attr = as_contract_key_fun(el?.getAttribute("data-contract") ?? null);
  if (from_attr !== null) return from_attr;
  const from_query = as_contract_key_fun(
    new URLSearchParams(window.location.search).get("id"),
  );
  return from_query ?? "rhea-amm";
}
// ========================================
// read the optional DAO contract id from the page url.
function get_dao_id_fun(): string {
  if (typeof window === "undefined") return HUGGIES_DEFAULT_DAO_ID;
  const id = new URLSearchParams(window.location.search).get("dao_id");
  return id?.trim() || HUGGIES_DEFAULT_DAO_ID;
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
// render pool rows with token links and readable reserve amounts.
function pool_rows_fun(
  rows: ReadonlyArray<{
    label: string;
    token_ids: ReadonlyArray<string>;
    amounts: ReadonlyArray<string>;
  }>,
): preact.JSX.Element {
  if (rows.length === 0) return <p>NO POOLS MATCH THIS FILTER.</p>;
  return (
    <div class="huggies-contract-pool-grid">
      {rows.map((row) => (
        <article class="huggies-contract-pool-card">
          <h3>{row.label}</h3>
          {row.token_ids.map((token_id, index) => (
            <div class="huggies-contract-pool-token">
              <a href={token_detail_href_fun(token_id, current_app_depth_fun())}>
                {token_id}
              </a>
              <code>{row.amounts[index] ?? "0"}</code>
            </div>
          ))}
        </article>
      ))}
    </div>
  );
}
// ========================================
// render the searchable pool browser used by all three dex pages.
function pool_browser_fun(
  pools: ReadonlyArray<{
    label: string;
    token_ids: ReadonlyArray<string>;
    amounts: ReadonlyArray<string>;
  }>,
  total_pools: number | null = null,
): preact.JSX.Element {
  const [query, set_query] = use_state("");
  const [token_id, set_token_id] = use_state<string | null>(null);
  const summary = pool_summary_fun(pools);
  const filtered = filter_pools_fun(pools, query, token_id);
  return (
    <>
      {metadata_fun([
        [
          "TOTAL POOLS",
          (total_pools ?? summary.total_pools).toLocaleString(),
        ],
        ["UNIQUE TOKENS", summary.unique_tokens.toLocaleString()],
      ])}
      <section class="huggies-contract-pool-controls">
        <label>
          <span>SEARCH TOKEN</span>
          <input
            type="search"
            value={query}
            placeholder="token account id"
            onInput={(event) => {
              set_query((event.currentTarget as HTMLInputElement).value);
            }}
          />
        </label>
        <label>
          <span>FILTER TOKEN</span>
          <select
            value={token_id ?? ""}
            onChange={(event) => {
              const value = (event.currentTarget as HTMLSelectElement).value;
              set_token_id(value.length === 0 ? null : value);
            }}
          >
            <option value="">ALL TOKENS</option>
            {summary.token_ids.map((id) => (
              <option value={id}>{id}</option>
            ))}
          </select>
        </label>
      </section>
      <p class="huggies-contract-pool-count">
        SHOWING {filtered.length} OF {pools.length} POOLS
      </p>
      {pool_rows_fun(filtered)}
    </>
  );
}
// ========================================
// render the page for one contract and its loaded data.
function render_contract_fun(
  key: HUGGIES_CONTRACT_KEY,
  data: HUGGIES_CONTRACT_DATA | null,
  account_id: string | null,
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
      label: `POOL ${pool.pool_id}`,
      token_ids: pool.token_ids,
      amounts: pool.amounts,
    }));
    return (
      <section>
        <h1>{heading}</h1>
        {metadata_fun([
          ["CONTRACT", contract_id],
          ["ACTIVE ACCOUNT", account_id ?? "NOT SIGNED IN"],
        ])}
        <h2>POOLS / LIQUIDITY</h2>
        {pool_browser_fun(rows, data.data.total_pools)}
      </section>
    );
  }

  if (data.kind === "rhea-dcl-v2") {
    const rows = data.data.pools.map((pool) => ({
      label: pool.pool_id,
      token_ids: [pool.token_x, pool.token_y],
      amounts: [pool.total_x, pool.total_y],
    }));
    return (
      <section>
        <h1>{heading}</h1>
        {metadata_fun([
          ["CONTRACT", contract_id],
          ["ACTIVE ACCOUNT", account_id ?? "NOT SIGNED IN"],
        ])}
        <h2>POOLS / LIQUIDITY</h2>
        {pool_browser_fun(rows)}
      </section>
    );
  }

  if (data.kind === "intear-dex") {
    const rows = data.data.pools.map((pool) => ({
      label: `POOL ${pool.pool_id} (${pool.kind})`,
      token_ids: pool.token_ids,
      amounts: pool.amounts,
    }));
    return (
      <section>
        <h1>{heading}</h1>
        {metadata_fun([
          ["CONTRACT", contract_id],
          ["LIVE POOL DEX", "slimedragon.near/xyk"],
          ["ACTIVE ACCOUNT", account_id ?? "NOT SIGNED IN"],
        ])}
        <h2>POOLS / LIQUIDITY</h2>
        {pool_browser_fun(rows)}
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
      ])}
      <div class="huggies-pumpopoly-cards">
        <article class="huggies-pumpopoly-card is-balance">
          <span class="huggies-pumpopoly-label">IN-GAME BALANCE</span>
          <strong class="huggies-pumpopoly-value">
            {player?.balance_human ?? "0"}
          </strong>
          <span class="huggies-pumpopoly-sub">
            PUMPOPOLY TOKENS
          </span>
          {player !== null && (
            <code class="huggies-pumpopoly-raw">{player.balance}</code>
          )}
        </article>
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
            {data.data.credit_score}
          </strong>
          <span class="huggies-pumpopoly-sub">LAND + INVITES</span>
        </article>
        <article class="huggies-pumpopoly-card">
          <span class="huggies-pumpopoly-label">NFTS HELD</span>
          <strong class="huggies-pumpopoly-value">
            {data.data.nft_count}
          </strong>
          <span class="huggies-pumpopoly-sub">PUMPOPOLY NFTS</span>
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
      </div>
      <h2>ACCOUNT INFO</h2>
      <div class="huggies-pumpopoly-info">
        <div>
          <span>INVITED BY</span>
          <code>{player?.invited_by || "NONE"}</code>
        </div>
        <div>
          <span>LAST MOVE</span>
          <code>{player?.last_move || "UNKNOWN"}</code>
        </div>
      </div>
      <h2>NFT HOLDINGS</h2>
      {data.data.nft_token_ids.length === 0 ? (
        <p>NO NFTS</p>
      ) : (
        <ul class="huggies-pumpopoly-nfts">
          {data.data.nft_token_ids.map((token_id) => (
            <li>
              <code>{token_id}</code>
            </li>
          ))}
        </ul>
      )}
      {invite_link !== "" && (
        <p class="huggies-pumpopoly-invite">
          INVITE LINK: <a href={invite_link}>{invite_link}</a>
        </p>
      )}
    </section>
  );
}
// ========================================
// render the DAO selector and signed-in account balances.
function dao_selector_fun(
  dao_id: string,
  account_id: string | null,
  balances: ReadonlyArray<{
    token_id: string;
    amount: string;
    decimals: number;
  }>,
): preact.JSX.Element {
  const [input_id, set_input_id] = use_state<string>(dao_id);
  const [treasuries, set_treasuries] = use_state<
    ReadonlyArray<{ daoId: string; config: { name?: unknown } | null }>
  >([]);
  use_effect(() => {
    if (account_id === null) return;
    let cancelled = false;
    void list_trezu_treasuries_fun(account_id)
      .then((rows) => {
        if (!cancelled) set_treasuries(rows);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [account_id]);
  const open_dao_fun = (next_id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("dao_id", next_id);
    window.location.href = url.toString();
  };
  return (
    <section class="huggies-dao-selector">
      <label>
        <span>DAO ACCOUNT ID</span>
        <div class="huggies-dao-selector-row">
          <input
            type="text"
            value={input_id}
            placeholder="dao.near"
            onInput={(event) => {
              set_input_id((event.currentTarget as HTMLInputElement).value);
            }}
          />
          <button type="button" onClick={() => open_dao_fun(input_id.trim())}>
            OPEN DAO
          </button>
        </div>
      </label>
      {treasuries.length > 0 && (
        <label>
          <span>YOUR DAOS</span>
          <select
            value={dao_id}
            onChange={(event) => {
              open_dao_fun((event.currentTarget as HTMLSelectElement).value);
            }}
          >
            {treasuries.map((treasury) => (
              <option value={treasury.daoId}>
                {typeof treasury.config?.name === "string"
                  ? `${treasury.config.name} (${treasury.daoId})`
                  : treasury.daoId}
              </option>
            ))}
          </select>
        </label>
      )}
      {account_id !== null && (
        <div class="huggies-dao-balance-card">
          <h2>YOUR DAO BALANCE</h2>
          {balances.length === 0 ? (
            <p>NO DAO BALANCES</p>
          ) : (
            <ul>
              {balances.map((balance) => (
                <li>
                  <a
                    href={token_detail_href_fun(
                      balance.token_id,
                      current_app_depth_fun(),
                    )}
                  >
                    {balance.token_id}
                  </a>
                  <code>
                    {HUGGIES_AMOUNT_FORMAT.balance(balance.amount, {
                      decimals: balance.decimals,
                    })}
                  </code>
                </li>
              ))}
            </ul>
          )}
        </div>
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
  const [dao_balances, set_dao_balances] = use_state<
    ReadonlyArray<{ token_id: string; amount: string; decimals: number }>
  >([]);
  const key = get_contract_key_fun();
  const dao_id = get_dao_id_fun();

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
        return { kind: key, data: await load_rhea_amm_page_fun() };
      }
      if (key === "rhea-dcl-v2") {
        return { kind: key, data: await load_rhea_dcl_page_fun() };
      }
      if (key === "intear-dex") {
        return { kind: key, data: await load_intear_dex_page_fun() };
      }
      if (key === "sputnik-dao") {
        return { kind: key, data: await load_sputnik_dao_page_fun(dao_id) };
      }
      return { kind: key, data: await load_pumpopoly_page_fun(account_id) };
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
  }, [key, dao_id, account_id]);

  use_effect(() => {
    if (key !== "sputnik-dao" || account_id === null) return;
    let cancelled = false;
    void load_dao_account_balances_fun(dao_id, account_id)
      .then((rows) => {
        if (!cancelled) set_dao_balances(rows);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        set_errors((current) => [
          ...current,
          `dao balances: ${err instanceof Error ? err.message : String(err)}`,
        ]);
      });
    return () => {
      cancelled = true;
    };
  }, [key, dao_id, account_id]);

  return (
    <div class="huggies-contract-page huggies-page">
      {key === "sputnik-dao" &&
        dao_selector_fun(dao_id, account_id, dao_balances)}
      {render_contract_fun(key, data, account_id)}
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
          <a href={contract_page_href_fun(card.page)}>{card.title}</a>
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
