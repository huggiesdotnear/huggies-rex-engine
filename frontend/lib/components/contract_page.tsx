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
import {
  HUGGIES_PUMPOPOLY_INVITE_ACCOUNT,
  pumpopoly_account_id_from_url_fun,
  pumpopoly_invite_link_fun,
} from "../ts/pumpopoly_link";
import { list_trezu_treasuries_fun } from "../ts/trezu_treasuries";
import { pool_summary_fun } from "../ts/contract_pool_stats";
import { current_app_depth_fun } from "../ts/app_depth";
import { token_detail_href_fun } from "../ts/token_link";
import { huggies_pool_browser_fun } from "./pool_browser";
import { huggies_balance_panel_fun } from "./balance_panel";
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
  const from_attr = as_contract_key_fun(
    el?.getAttribute("data-contract") ?? null,
  );
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
// render the members of one policy role.
function dao_role_fun(role: {
  name: string;
  members: string[];
}): preact.JSX.Element {
  return (
    <article class="huggies-dao-role">
      <h3>{role.name}</h3>
      {role.members.length === 0 ? (
        <p class="huggies-dao-empty">NO GROUP MEMBERS</p>
      ) : (
        <ul class="huggies-dao-members">
          {role.members.map((member) => (
            <li>
              <a
                href={`${"../".repeat(current_app_depth_fun())}account.html?id=${encodeURIComponent(member)}`}
              >
                {member}
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
// ========================================
// render the page for one contract and its loaded data.
function render_contract_fun(
  key: HUGGIES_CONTRACT_KEY,
  data: HUGGIES_CONTRACT_DATA | null,
): preact.JSX.Element {
  const cards = list_contract_cards_fun();
  const card = cards.find((item) => item.key === key);
  // --- WHY --- the Pumpopoly h1 is all lowercase to match the site's
  // heading style. its card title is "Pumpopoly", so it is uppercased
  // here instead of hardcoding a second spelling of the name.
  const heading =
    key === "pumpopoly"
      ? (card?.title ?? key).toUpperCase()
      : (card?.title ?? key);

  if (data === null) {
    return (
      <section>
        <h1>{heading}</h1>
        <p>LOADING...</p>
      </section>
    );
  }

  if (data.kind === "rhea-amm") {
    const pools = data.data.pools.map((pool) => ({
      pool_id: String(pool.pool_id),
      label: pool.dex,
      token_ids: pool.token_ids,
      amounts: pool.amounts,
    }));
    const summary = pool_summary_fun(pools);
    return (
      <section>
        <h1>{heading}</h1>
        <h2>POOLS</h2>
        {huggies_pool_browser_fun({
          pools,
          total_pools: data.data.total_pools,
          unique_tokens: summary.unique_tokens,
          external_url: (pool_id) => `https://app.rhea.finance/pool/${pool_id}`,
        })}
      </section>
    );
  }

  if (data.kind === "rhea-dcl-v2") {
    const pools = data.data.pools.map((pool) => ({
      pool_id: pool.pool_id,
      label: "DCL",
      token_ids: [pool.token_x, pool.token_y],
      amounts: [pool.total_x, pool.total_y],
    }));
    const summary = pool_summary_fun(pools);
    return (
      <section>
        <h1>{heading}</h1>
        <h2>POOLS</h2>
        {huggies_pool_browser_fun({
          pools,
          total_pools: data.data.total_pools,
          unique_tokens: summary.unique_tokens,
        })}
      </section>
    );
  }

  if (data.kind === "intear-dex") {
    const pools = data.data.pools.map((pool) => ({
      pool_id: pool.pool_id,
      label: pool.kind.toUpperCase(),
      token_ids: pool.token_ids,
      amounts: pool.amounts,
    }));
    const summary = pool_summary_fun(pools);
    return (
      <section>
        <h1>{heading}</h1>
        <h2>POOLS</h2>
        {huggies_pool_browser_fun({
          pools,
          total_pools: data.data.total_pools,
          unique_tokens: summary.unique_tokens,
        })}
      </section>
    );
  }

  if (data.kind === "sputnik-dao") {
    const name = String(data.data.config.name ?? "SPUTNIK DAO");
    const members = data.data.roles.reduce(
      (sum, role) => sum + role.members.length,
      0,
    );
    return (
      <section>
        <header class="huggies-dao-header">
          <h1>{name}</h1>
          <code>{get_dao_id_fun()}</code>
        </header>
        <section class="huggies-dao-stats">
          <article class="huggies-dao-stat">
            <span class="huggies-dao-stat-value">
              {data.data.roles.length.toLocaleString()}
            </span>
            <span class="huggies-dao-stat-label">ROLES</span>
          </article>
          <article class="huggies-dao-stat">
            <span class="huggies-dao-stat-value">
              {members.toLocaleString()}
            </span>
            <span class="huggies-dao-stat-label">MEMBERS</span>
          </article>
          <article class="huggies-dao-stat">
            <span class="huggies-dao-stat-value">
              {data.data.proposals.length.toLocaleString()}
            </span>
            <span class="huggies-dao-stat-label">PROPOSALS</span>
          </article>
        </section>
        <h2>MEMBERS / POLICY ROLES</h2>
        {data.data.roles.length === 0 ? (
          <p>NO POLICY ROLES</p>
        ) : (
          <div class="huggies-dao-roles">
            {data.data.roles.map((role) => dao_role_fun(role))}
          </div>
        )}
        <h2>PROPOSALS</h2>
        {data.data.proposals.length === 0 ? (
          <p>NO PROPOSALS</p>
        ) : (
          <ul class="huggies-dao-proposals">
            {data.data.proposals.map((proposal) => (
              <li class="huggies-dao-proposal">
                <header>
                  <span class="huggies-dao-proposal-id">#{proposal.id}</span>
                  <span class="huggies-dao-proposal-status">
                    {proposal.status}
                  </span>
                </header>
                <p>{proposal.description}</p>
                <footer>
                  <a
                    href={`${"../".repeat(current_app_depth_fun())}account.html?id=${encodeURIComponent(proposal.proposer)}`}
                  >
                    {proposal.proposer || "UNKNOWN PROPOSER"}
                  </a>
                  {proposal.submission_time !== "" && (
                    <span>{proposal.submission_time}</span>
                  )}
                </footer>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  const player = data.data.player;
  return (
    <section>
      <h1>{heading}</h1>
      <p class="huggies-pumpopoly-contract">
        <code>world.pumpopoly.near</code>
      </p>
      <h2>WORLD</h2>
      <div class="huggies-pumpopoly-cards">
        <article class="huggies-pumpopoly-card is-balance">
          <span class="huggies-pumpopoly-label">IN-GAME BALANCE</span>
          <strong class="huggies-pumpopoly-value">
            {player?.balance_human ?? "0"}
          </strong>
          <span class="huggies-pumpopoly-sub">PUMPOPOLY TOKENS</span>
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
          <span class="huggies-pumpopoly-label">INVITES</span>
          <strong class="huggies-pumpopoly-value">
            {player?.invites ?? 0}
          </strong>
          <span class="huggies-pumpopoly-sub">
            {player?.invitees ?? 0} INVITEES
          </span>
        </article>
      </div>
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
      <h2>NFT</h2>
      <p class="huggies-pumpopoly-contract">
        <code>nft.pumpopoly.near</code>
      </p>
      <div class="huggies-pumpopoly-cards">
        <article class="huggies-pumpopoly-card">
          <span class="huggies-pumpopoly-label">NFTS HELD</span>
          <strong class="huggies-pumpopoly-value">{data.data.nft.count}</strong>
          <span class="huggies-pumpopoly-sub">PUMPOPOLY NFTS</span>
        </article>
      </div>
      {data.data.nft.token_ids.length === 0 ? (
        <p>NO NFTS</p>
      ) : (
        <ul class="huggies-pumpopoly-nfts">
          {data.data.nft.token_ids.map((token_id) => (
            <li>
              <code>{token_id}</code>
            </li>
          ))}
        </ul>
      )}
      <p class="huggies-pumpopoly-invite">
        INVITE LINK:{" "}
        <a href={pumpopoly_invite_link_fun(HUGGIES_PUMPOPOLY_INVITE_ACCOUNT)}>
          {HUGGIES_PUMPOPOLY_INVITE_ACCOUNT}
        </a>
      </p>
    </section>
  );
}
// ========================================
// render the DAO selector.
function dao_selector_fun(
  dao_id: string,
  account_id: string | null,
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
      <div class="huggies-dao-selector-fields">
        <label class="huggies-dao-input">
          <span>DAO ACCOUNT ID</span>
          <input
            type="text"
            value={input_id}
            placeholder="dao.near"
            onInput={(event) => {
              set_input_id((event.currentTarget as HTMLInputElement).value);
            }}
          />
        </label>
        <button
          type="button"
          class="huggies-dao-open"
          onClick={() => open_dao_fun(input_id.trim())}
        >
          OPEN DAO
        </button>
      </div>
      {treasuries.length > 0 && (
        <label class="huggies-dao-select">
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
    </section>
  );
}
// ========================================
// render the Pumpopoly account selector.
function pumpopoly_account_selector_fun(
  account_id: string | null,
): preact.JSX.Element {
  const [input_id, set_input_id] = use_state<string>(account_id ?? "");
  const open_account_fun = () => {
    const next_id = input_id.trim();
    if (next_id.length === 0) return;
    const url = new URL(window.location.href);
    url.searchParams.set("id", next_id);
    window.location.href = url.toString();
  };
  return (
    <section class="huggies-pumpopoly-selector">
      <label class="huggies-pumpopoly-input">
        <span>ACCOUNT ID</span>
        <input
          type="text"
          value={input_id}
          placeholder="account.near"
          onInput={(event) => {
            set_input_id((event.currentTarget as HTMLInputElement).value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") open_account_fun();
          }}
        />
      </label>
      <button
        type="button"
        class="huggies-pumpopoly-open"
        onClick={open_account_fun}
      >
        OPEN ACCOUNT
      </button>
    </section>
  );
}
// ========================================
// shared smart-contract page component.
export function HUGGIES_COMPONENT_CONTRACT_PAGE_FUN() {
  const [data, set_data] = use_state<HUGGIES_CONTRACT_DATA | null>(null);
  const [account_id, set_account_id] = use_state<string | null>(null);
  const [errors, set_errors] = use_state<string[]>([]);
  const key = get_contract_key_fun();
  const dao_id = get_dao_id_fun();
  const pumpopoly_account_id = pumpopoly_account_id_from_url_fun();

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
      return {
        kind: key,
        data: await load_pumpopoly_page_fun(pumpopoly_account_id),
      };
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
  }, [key, dao_id, pumpopoly_account_id]);

  return (
    <div class="huggies-contract-page huggies-page">
      {key === "sputnik-dao" && dao_selector_fun(dao_id, account_id)}
      {key === "pumpopoly" &&
        pumpopoly_account_selector_fun(pumpopoly_account_id)}
      {render_contract_fun(key, data)}
      {/* --- WHY --- no balance panel on the Pumpopoly page. it asked
          for the signed-in account's balances, but the page is about a
          player named in the url, so the panel showed someone else's
          money next to another player's stats. the Pumpopoly cards
          already carry the player's own token balance. --- */}
      {key !== "pumpopoly" && account_id !== null && (
        <div class="huggies-balance-table">
          {huggies_balance_panel_fun({
            account_id,
            title: "YOUR BALANCE",
          })}
        </div>
      )}
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
