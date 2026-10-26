// ========================================
// the Pumpopoly contract page.
// ========================================
import { render } from "preact";
import { useState as use_state, useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { load_pumpopoly_page_fun } from "../ts/contract_page_pumpopoly";
import {
  HUGGIES_PUMPOPOLY_INVITE_ACCOUNT,
  pumpopoly_account_id_from_url_fun,
  pumpopoly_invite_link_fun,
} from "../ts/contract_page_pumpopoly_link";
import { huggies_contract_layout_fun } from "./contract_layout";
// ========================================
// render the Pumpopoly account selector.
function pumpopoly_account_selector_fun(props: {
  account_id: string | null;
}): preact.JSX.Element {
  const [input_id, set_input_id] = use_state<string>(
    props.account_id ?? "",
  );
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
// the Pumpopoly contract page component.
export function HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PAGE_FUN() {
  const [data, set_data] = use_state<
    Awaited<ReturnType<typeof load_pumpopoly_page_fun>> | null
  >(null);
  const [errors, set_errors] = use_state<string[]>([]);
  const account_id = pumpopoly_account_id_from_url_fun();

  use_effect(() => {
    let cancelled = false;
    set_data(null);
    void load_pumpopoly_page_fun(account_id)
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
  }, [account_id]);

  const player = data?.player ?? null;

  const body = (
    <section>
      <h1>PUMPOPOLY</h1>
      {pumpopoly_account_selector_fun({ account_id })}
      <h2>world.pumpopoly.near</h2>
      <div class="huggies-pumpopoly-balance">
        <span class="huggies-pumpopoly-label">IN-GAME BALANCE</span>
        <strong class="huggies-pumpopoly-balance-value">
          {player?.balance_human ?? "0"}
        </strong>
        <span class="huggies-pumpopoly-sub">PUMPOPOLY TOKENS</span>
        {player !== null && (
          <code class="huggies-pumpopoly-raw">{player.balance}</code>
        )}
      </div>
      <div class="huggies-pumpopoly-cards">
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
            {data?.credit_score ?? 0}
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
        <article class="huggies-pumpopoly-card">
          <span class="huggies-pumpopoly-label">INVITED BY</span>
          <strong class="huggies-pumpopoly-text">
            {player?.invited_by || "NONE"}
          </strong>
        </article>
        <article class="huggies-pumpopoly-card">
          <span class="huggies-pumpopoly-label">LAST MOVE</span>
          <strong class="huggies-pumpopoly-text">
            {player?.last_move || "UNKNOWN"}
          </strong>
        </article>
      </div>
      <h2>nft.pumpopoly.near</h2>
      <div class="huggies-pumpopoly-cards">
        <article class="huggies-pumpopoly-card">
          <span class="huggies-pumpopoly-label">NFTS HELD</span>
          <strong class="huggies-pumpopoly-value">
            {data?.nft.count ?? 0}
          </strong>
          <span class="huggies-pumpopoly-sub">PUMPOPOLY NFTS</span>
        </article>
      </div>
      {(data?.nft.token_ids.length ?? 0) === 0 ? (
        <p>NO NFTS</p>
      ) : (
        <ul class="huggies-pumpopoly-nfts">
          {(data?.nft.token_ids ?? []).map((token_id) => (
            <li>
              <code>{token_id}</code>
            </li>
          ))}
        </ul>
      )}
      <a
        class="huggies-pumpopoly-invite"
        href={pumpopoly_invite_link_fun(HUGGIES_PUMPOPOLY_INVITE_ACCOUNT)}
        target="_blank"
        rel="noreferrer"
      >
        NEW PLAYERS START HERE
      </a>
    </section>
  );

  return (
    // --- WHY --- no balance panel on the Pumpopoly page. it asked for
    // the signed-in account's balances, but the page is about a player
    // named in the url, so the panel showed someone else's money next
    // to another player's stats. the Pumpopoly cards already carry the
    // player's own token balance.
    <>
      {huggies_contract_layout_fun({
        title: "PUMPOPOLY",
        show_balance: false,
        errors,
        children: body,
      })}
    </>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PAGE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PAGE_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
