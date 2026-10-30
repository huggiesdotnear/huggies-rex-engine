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
// it reads the loaded dao from the page's store. it fetches nothing.
// ========================================
import { render } from "preact";
import { useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_DAO_PAGE_STATE } from "../ts/contract_page_sputnik_dao_state";
import { use_page_store_fun } from "../ts/use_page_store";
import { current_app_depth_fun } from "../ts/app_depth";
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
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_PROPOSALS_FUN() {
  // the proposals the reader has opened.
  const [open_ids, set_open_ids] = use_state<number[]>([]);

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

  return (
    <section>
      <h2>PROPOSALS ({dao.proposals.length})</h2>
      <div class="proposals-scroll">
        <div class="proposals">
          {dao.proposals.map((proposal) => {
            const is_open = open_ids.includes(proposal.id);
            return (
              <div
                key={proposal.id}
                class={`proposal is-${status_slug_fun(proposal.status)}`}
              >
                <div class="proposal-head">
                  <span class="proposal-id">{proposal.id}</span>
                  <span class="proposal-copy">
                    <span class="proposal-kind">{proposal.kind}</span>
                    <span class="proposal-what">{proposal.kind_summary}</span>
                  </span>
                  <span class="proposal-meta">
                    <span class="proposal-status">
                      <span class="status">{proposal.status}</span>
                    </span>
                    <span class="proposal-votes">{proposal.votes_count} VOTES</span>
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
                    {proposal.description.length > 0 && (
                      <p class="note">{proposal.description}</p>
                    )}
                    {proposal.votes.length > 0 && (
                      <p class="vote-list">
                        {proposal.votes
                          .map((vote) => `${vote.account_id} ${vote.vote}`)
                          .join(" · ")}
                      </p>
                    )}
                    {proposal.description.length === 0 &&
                      proposal.votes.length === 0 && (
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
