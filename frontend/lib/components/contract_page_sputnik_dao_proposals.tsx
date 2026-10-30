// ========================================
// the DAO's proposals: one card per proposal — id, kind, what it does,
// status, proposer, votes, date.
//
// the card shows the kind's real content, because that is the
// proposal: a Transfer says how much of which token went to whom, and
// a card reading only "Transfer" says nothing. the proposer's own note
// is the description, and it sits in the expanded part of the card.
//
// --- WHY --- the card expands in place rather than opening a second
// panel: the note and the votes belong to their proposal, so they read
// best directly under it.
//
// --- WHY --- the status filter is above the list: a dao can have
// forty proposals and the reader usually wants the ones that are still
// live, or the ones that were turned down. scrolling past thirty
// approved cards to find the rejected one is not a way to read them.
//
// --- WHY --- each kind gets its own detail block: nineteen function
// calls can all call the same contract and still be nineteen different
// proposals. the block says which method it is, what it passes, and
// who it touches.
//
// it reads the loaded dao from the page's store. it fetches nothing.
// ========================================
import { render } from "preact";
import { useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_DAO_PAGE_STATE } from "../ts/contract_page_sputnik_dao_state";
import { use_page_store_fun } from "../ts/use_page_store";
import { current_app_depth_fun } from "../ts/app_depth";
import type { HUGGIES_DAO_PROPOSAL } from "../ts/contract_page_sputnik_dao";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the status slug for a proposal's status, so each status reads at a
// glance.
function status_slug_fun(status: string): string {
  switch (status) {
    case "Approved":
      return "approved";
    case "Rejected":
    case "Removed":
      return "rejected";
    case "Expired":
    case "Failed":
      return "expired";
    case "InProgress":
      return "in-progress";
    default:
      return "unknown";
  }
}
// ========================================
// the human date of a nanosecond timestamp.
//
// --- WHY --- the date is day and month and year, with no weekday and
// no time: the card's date line is narrow, and "Mar 14, 2026" is as
// much of a proposal's date as anyone reads.
function format_time_fun(nanoseconds: string): string {
  if (nanoseconds.length === 0) return "—";
  const value = Number(nanoseconds);
  if (!Number.isFinite(value) || value <= 0) return "—";
  return new Date(value / 1e6).toLocaleDateString(undefined, {
    year: "2-digit",
    month: "short",
    day: "numeric",
  });
}
// ========================================
// shorten a blob of json so a card can show it.
//
// --- WHY --- the args of a function call can be a few kilobytes of
// base64 and json. the card shows the start of it, and the whole of it
// is in the element's title so the reader can still get it.
function shorten_args_fun(args: string): string {
  const clean = args.trim();
  if (clean.length <= 220) return clean;
  return `${clean.slice(0, 220)}…`;
}
// ========================================
// read a function call's args.
//
// --- WHY --- the contract hands the args over as base64: the args of
// a near call are bytes, not text. showing them raw is a wall of
// `eyJ...` that says nothing, so they are decoded and the json inside
// is shown instead.
function read_call_args_fun(args: string): string {
  const clean = args.trim();
  if (clean.length === 0) return "";
  // the args are usually base64 of json.
  try {
    const decoded = atob(clean);
    const parsed: unknown = JSON.parse(decoded);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // --- WHY --- not every call's args are base64 json: a plain json
    // string is used as it is, and anything else is shown as it came.
  }
  try {
    const parsed: unknown = JSON.parse(clean);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return clean;
  }
}
// ========================================
// --- DETAIL BLOCK ----------------------
// the detail a proposal's own kind carries.
//
// --- WHY --- one block for every kind and not a branch in the card:
// the card stays a card, and each kind's own facts sit in the same
// place whatever the kind is.
function proposal_detail_fun(
  proposal: HUGGIES_DAO_PROPOSAL,
  depth: number,
): preact.JSX.Element | null {
  const detail = proposal.detail;

  // a Transfer: what moves, how much, to whom.
  if (detail.amount_text.length > 0) {
    return (
      <div class="detail-block">
        <div class="detail-row">
          <span class="detail-label">AMOUNT</span>
          <span class="detail-value">
            {detail.amount_text} {detail.token_symbol}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">TOKEN</span>
          <span class="detail-value">
            {detail.token_id.length > 0 ? detail.token_id : "NEAR"}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">TO</span>
          <span class="detail-value">
            <a
              href={`${"../".repeat(depth)}account.html?id=${encodeURIComponent(detail.receiver_id)}`}
            >
              {detail.receiver_id}
            </a>
          </span>
        </div>
        {detail.msg.length > 0 && (
          <div class="detail-row">
            <span class="detail-label">NOTE</span>
            <span class="detail-value">{detail.msg}</span>
          </div>
        )}
      </div>
    );
  }

  // a FunctionCall: which method, on which contract, with what args.
  if (detail.call_method.length > 0) {
    return (
      <div class="detail-block">
        <div class="detail-row">
          <span class="detail-label">METHOD</span>
          <span class="detail-value">{detail.call_method}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">CONTRACT</span>
          <span class="detail-value">
            <a
              href={`${"../".repeat(depth)}account.html?id=${encodeURIComponent(detail.receiver_id)}`}
            >
              {detail.receiver_id}
            </a>
          </span>
        </div>
        {detail.call_args.map((args, index) => {
          const readable = read_call_args_fun(args);
          return (
            <div class="detail-row" key={index}>
              <span class="detail-label">
                {detail.call_args.length > 1 ? `ARGS ${index + 1}` : "ARGS"}
              </span>
              <span class="detail-value is-code" title={readable}>
                {shorten_args_fun(readable)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // a ChangeConfig: the new name, purpose and theme.
  if (detail.config_name.length > 0 || detail.config_purpose.length > 0) {
    return (
      <div class="detail-block">
        {detail.config_name.length > 0 && (
          <div class="detail-row">
            <span class="detail-label">NAME</span>
            <span class="detail-value">{detail.config_name}</span>
          </div>
        )}
        {detail.config_purpose.length > 0 && (
          <div class="detail-row">
            <span class="detail-label">PURPOSE</span>
            <span class="detail-value">{detail.config_purpose}</span>
          </div>
        )}
        {detail.config_color.length > 0 && (
          <div class="detail-row">
            <span class="detail-label">COLOR</span>
            <span class="detail-value">
              <span
                class="detail-swatch"
                style={{ background: detail.config_color }}
              />
              {detail.config_color}
            </span>
          </div>
        )}
        {detail.config_logo.length > 0 && (
          <div class="detail-row">
            <span class="detail-label">LOGO</span>
            <span class="detail-value">
              <img class="detail-logo" src={detail.config_logo} alt="" />
            </span>
          </div>
        )}
      </div>
    );
  }

  // a policy change: the roles it carries.
  if (detail.policy_roles.length > 0) {
    return (
      <div class="detail-block">
        <div class="detail-row">
          <span class="detail-label">ROLES</span>
          <span class="detail-value">
            <span class="detail-chips">
              {detail.policy_roles.map((role) => (
                <span class="detail-chip" key={role.name}>
                  {role.name}
                  <span class="detail-chip-count">{role.members}</span>
                </span>
              ))}
            </span>
          </span>
        </div>
      </div>
    );
  }

  // a member change: which account, into which role.
  if (detail.member_id.length > 0) {
    return (
      <div class="detail-block">
        <div class="detail-row">
          <span class="detail-label">ACCOUNT</span>
          <span class="detail-value">
            <a
              href={`${"../".repeat(depth)}account.html?id=${encodeURIComponent(detail.member_id)}`}
            >
              {detail.member_id}
            </a>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ROLE</span>
          <span class="detail-value">{detail.role_name}</span>
        </div>
      </div>
    );
  }

  return null;
}
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_PROPOSALS_FUN() {
  // the proposals the reader has opened.
  const [open_ids, set_open_ids] = use_state<number[]>([]);
  // the status the reader is looking at. "all" shows every one.
  const [filter, set_filter] = use_state<string>("all");

  const state = use_page_store_fun(HUGGIES_DAO_PAGE_STATE);
  const dao = state.dao;
  if (dao === null) return null;

  const depth = current_app_depth_fun();

  if (dao.proposals.length === 0) {
    return (
      <section>
        <h2>PROPOSALS</h2>
        <p class="empty">NO PROPOSALS</p>
      </section>
    );
  }

  const toggle_fun = (id: number) => {
    set_open_ids((current) =>
      current.includes(id)
        ? current.filter((open) => open !== id)
        : [...current, id],
    );
  };

  // the statuses the dao actually has, most common first.
  //
  // --- WHY --- the buttons are the dao\'s own statuses and not a fixed
  // list: a dao with only approved proposals should not show a
  // "REJECTED" button that leads nowhere.
  const status_counts = new Map<string, number>();
  for (const proposal of dao.proposals) {
    status_counts.set(
      proposal.status,
      (status_counts.get(proposal.status) ?? 0) + 1,
    );
  }
  const statuses = [...status_counts.entries()].sort(
    (a, b) => b[1] - a[1],
  );

  const shown =
    filter === "all"
      ? dao.proposals
      : dao.proposals.filter((proposal) => proposal.status === filter);

  return (
    <section>
      <h2>PROPOSALS ({dao.proposals.length})</h2>
      <div class="filters">
        <button
          type="button"
          class={filter === "all" ? "filter is-active" : "filter"}
          aria-pressed={filter === "all"}
          onClick={() => set_filter("all")}
        >
          ALL {dao.proposals.length}
        </button>
        {statuses.map(([status, count]) => (
          <button
            type="button"
            key={status}
            class={
              filter === status ? "filter is-active" : "filter is-" + status_slug_fun(status)
            }
            aria-pressed={filter === status}
            onClick={() => set_filter(status)}
          >
            {status.toUpperCase()} {count}
          </button>
        ))}
      </div>
      <div class="proposals-scroll">
        <div class="proposals">
          {shown.length === 0 && <p class="empty">NO PROPOSALS</p>}
          {shown.map((proposal) => {
            const is_open = open_ids.includes(proposal.id);
            const detail = proposal_detail_fun(proposal, depth);
            return (
              <div
                key={proposal.id}
                class={`proposal is-${status_slug_fun(proposal.status)}`}
              >
                <div class="proposal-head">
                  <span class="proposal-copy">
                    <span class="proposal-kind">
                      <span class="proposal-id">#{proposal.id}</span>
                      {proposal.kind}
                    </span>
                    <span class="proposal-what">
                      {proposal.kind_summary}
                      {proposal.description.length > 0 && (
                        <span class="proposal-note-line">
                          {proposal.description}
                        </span>
                      )}
                    </span>
                  </span>
                  <span class="proposal-meta">
                    <span class="proposal-status">
                      <span class="status">{proposal.status}</span>
                    </span>
                    <span class="proposal-votes">
                      {proposal.votes_count} VOTE
                      {proposal.votes_count === 1 ? "" : "S"}
                    </span>
                  </span>
                </div>
                <div class="proposal-foot">
                  <span class="proposal-proposer">
                    {proposal.proposer.length === 0 ? (
                      "—"
                    ) : (
                      <a
                        href={`${"../".repeat(depth)}account.html?id=${encodeURIComponent(proposal.proposer)}`}
                      >
                        {proposal.proposer}
                      </a>
                    )}
                  </span>
                  <button
                    type="button"
                    class="toggle"
                    onClick={() => toggle_fun(proposal.id)}
                    aria-expanded={is_open}
                  >
                    {format_time_fun(proposal.submission_time)}
                    <span class="caret">{is_open ? "▲" : "▼"}</span>
                  </button>
                </div>
                {is_open && (
                  <div class="proposal-detail">
                    {detail}
                    {proposal.votes.length > 0 && (
                      <div class="vote-block">
                        <span class="detail-label">VOTES</span>
                        <span class="vote-list">
                          {proposal.votes
                            .map((vote) => `${vote.account_id} ${vote.vote}`)
                            .join(" · ")}
                        </span>
                      </div>
                    )}
                    {proposal.block_heights.length > 0 && (
                      <div class="vote-block">
                        <span class="detail-label">BLOCKS</span>
                        <span class="vote-list">
                          {proposal.block_heights.join(" · ")}
                        </span>
                      </div>
                    )}
                    {detail === null &&
                      proposal.votes.length === 0 &&
                      proposal.block_heights.length === 0 && (
                        <p class="note">NO DETAIL</p>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_PROPOSALS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    render(<HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_PROPOSALS_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
