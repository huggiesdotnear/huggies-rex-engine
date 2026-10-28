// ========================================
// the DAO's proposals: one row per proposal — id, kind, what it does,
// status, proposer, votes, date.
//
// the row shows the kind's real content, because that is the
// proposal: a Transfer says how much of which token went to whom, and
// a row reading only "Transfer" says nothing. the proposer's own note
// is the description, and it sits in the expanded part of the row.
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
// no time: the date column is narrow, and "Mar 14, 2026" is as much
// of a proposal's date as anyone reads.
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
        <table>
          <thead>
            <tr>
              <th class="col-id">#</th>
              <th class="col-kind">KIND</th>
              <th class="col-what">WHAT</th>
              <th class="col-status">STATUS</th>
              <th class="col-proposer">PROPOSER</th>
              <th class="col-votes">VOTES</th>
              <th class="col-date">DATE</th>
            </tr>
          </thead>
          <tbody>
            {dao.proposals.map((proposal) => {
              const is_open = open_ids.includes(proposal.id);
              return (
                <>
                  <tr
                    key={proposal.id}
                    class={`row is-${status_slug_fun(proposal.status)}`}
                  >
                    <td class="col-id">{proposal.id}</td>
                    <td class="col-kind">{proposal.kind}</td>
                    <td class="col-what">{proposal.kind_summary}</td>
                    <td class="col-status">
                      <span class="status">{proposal.status}</span>
                    </td>
                    <td class="col-proposer">
                      {proposal.proposer.length === 0 ? (
                        "—"
                      ) : (
                        <a
                          href={`${"../".repeat(depth)}account.html?id=${encodeURIComponent(proposal.proposer)}`}
                        >
                          {proposal.proposer}
                        </a>
                      )}
                    </td>
                    <td class="col-votes">{proposal.votes_count}</td>
                    <td class="col-date">
                      <button
                        type="button"
                        class="toggle"
                        onClick={() => toggle_fun(proposal.id)}
                        aria-expanded={is_open}
                      >
                        {format_time_fun(proposal.submission_time)}
                        <span class="caret">{is_open ? "▲" : "▼"}</span>
                      </button>
                    </td>
                  </tr>
                  {is_open && (
                    <tr key={`${proposal.id}-detail`} class="detail-row">
                      <td colSpan={7}>
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
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
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
