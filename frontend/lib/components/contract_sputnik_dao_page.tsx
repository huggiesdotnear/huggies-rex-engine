// ========================================
// the Sputnik DAO contract page.
// ========================================
import { render } from "preact";
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { load_sputnik_dao_page_fun } from "../ts/contract_page_sputnik_dao";
import { list_trezu_treasuries_fun } from "../ts/contract_page_trezu_treasuries";
import { current_app_depth_fun } from "../ts/app_depth";
import { huggies_contract_layout_fun } from "./contract_layout";
// ========================================
const HUGGIES_DEFAULT_DAO_ID = "sputnik-dao.near";
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
// render the DAO selector.
function dao_selector_fun(props: {
  dao_id: string;
  account_id: string | null;
}): preact.JSX.Element {
  const [input_id, set_input_id] = use_state<string>(props.dao_id);
  const [treasuries, set_treasuries] = use_state<
    ReadonlyArray<{ daoId: string; config: { name?: unknown } | null }>
  >([]);
  use_effect(() => {
    if (props.account_id === null) return;
    let cancelled = false;
    void list_trezu_treasuries_fun(props.account_id)
      .then((rows) => {
        if (!cancelled) set_treasuries(rows);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [props.account_id]);
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
            value={props.dao_id}
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
// the Sputnik DAO contract page component.
export function HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_PAGE_FUN() {
  const [data, set_data] = use_state<Awaited<
    ReturnType<typeof load_sputnik_dao_page_fun>
  > | null>(null);
  const [errors, set_errors] = use_state<string[]>([]);
  const dao_id = get_dao_id_fun();

  use_effect(() => {
    let cancelled = false;
    set_data(null);
    void load_sputnik_dao_page_fun(dao_id)
      .then((value) => {
        if (cancelled) return;
        set_data(value);
        set_errors(value.errors);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        set_errors([err instanceof Error ? err.message : String(err)]);
      });
    return () => {
      cancelled = true;
    };
  }, [dao_id]);

  const body =
    data === null ? (
      <section>
        <h1>LOADING...</h1>
      </section>
    ) : (
      <section>
        <header class="huggies-dao-header">
          <h1>{String(data.config.name ?? "SPUTNIK DAO")}</h1>
          <code>{dao_id}</code>
        </header>
        <section class="huggies-dao-stats">
          <article class="huggies-dao-stat">
            <span class="huggies-dao-stat-value">
              {data.roles.length.toLocaleString()}
            </span>
            <span class="huggies-dao-stat-label">ROLES</span>
          </article>
          <article class="huggies-dao-stat">
            <span class="huggies-dao-stat-value">
              {data.roles
                .reduce((sum, role) => sum + role.members.length, 0)
                .toLocaleString()}
            </span>
            <span class="huggies-dao-stat-label">MEMBERS</span>
          </article>
          <article class="huggies-dao-stat">
            <span class="huggies-dao-stat-value">
              {data.proposals.length.toLocaleString()}
            </span>
            <span class="huggies-dao-stat-label">PROPOSALS</span>
          </article>
        </section>
        <h2>MEMBERS / POLICY ROLES</h2>
        {data.roles.length === 0 ? (
          <p>NO POLICY ROLES</p>
        ) : (
          <div class="huggies-dao-roles">
            {data.roles.map((role) => dao_role_fun(role))}
          </div>
        )}
        <h2>PROPOSALS</h2>
        {data.proposals.length === 0 ? (
          <p>NO PROPOSALS</p>
        ) : (
          <ul class="huggies-dao-proposals">
            {data.proposals.map((proposal) => (
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

  return (
    <>
      {huggies_contract_layout_fun({
        title: "Sputnik DAO",
        errors,
        children: (
          <>
            {dao_selector_fun({ dao_id, account_id: null })}
            {body}
          </>
        ),
      })}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_PAGE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_PAGE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
