// ========================================
// the DAO's proposals: one row per proposal, with the id, the kind,
// the status, the proposer and the votes.
//
// it reads the loaded dao from the page's store. it fetches nothing.
// ========================================
import { render } from "preact";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_DAO_PAGE_STATE } from "../ts/contract_page_sputnik_dao_state";
import { current_app_depth_fun } from "../ts/app_depth";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the css class for a proposal's status, so each status reads at a
// glance.
function status_class_fun(status: string): string {
  switch (status) {
    case "Approved":
      return "is-approved";
    case "Rejected":
    case "Removed":
      return "is-rejected";
    case "Expired":
    case "Failed":
      return "is-expired";
    case "InProgress":
      return "is-in-progress";
    default:
      return "is-unknown";
  }
}
// ========================================
// the human date of a nanosecond timestamp.
function format_time_fun(nanoseconds: string): string {
  if (nanoseconds.length === 0) return "—";
  const value = Number(nanoseconds);
  if (!Number.isFinite(value) || value <= 0) return "—";
  return new Date(value / 1e6).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_PROPOSALS_FUN() {
  const [, set_revision] = use_state(0);

  use_effect(() => {
    const unsubscribe = HUGGIES_DAO_PAGE_STATE.subscribe(() => {
      set_revision((revision) => revision + 1);
    });
    return unsubscribe;
  }, []);

  const state = HUGGIES_DAO_PAGE_STATE.get();
  const dao = state.dao;
  if (dao === null) return null;

  const depth = current_app_depth_fun();

  if (dao.proposals.length === 0) {
    return (
      <section class="huggies-dao-proposals-section">
        <h2>PROPOSALS</h2>
        <p class="huggies-dao-empty">NO PROPOSALS</p>
      </section>
    );
  }

  return (
    <section class="huggies-dao-proposals-section">
      <h2>PROPOSALS ({dao.proposals.length})</h2>
      <div class="huggies-dao-proposals-scroll">
        <table class="huggies-dao-proposals-table">
          <thead>
            <tr>
              <th class="huggies-dao-proposal-id">#</th>
              <th class="huggies-dao-proposal-kind">KIND</th>
              <th class="huggies-dao-proposal-status-col">STATUS</th>
              <th class="huggies-dao-proposal-proposer">PROPOSER</th>
              <th class="huggies-dao-proposal-votes">VOTES</th>
              <th class="huggies-dao-proposal-date">DATE</th>
            </tr>
          </thead>
          <tbody>
            {dao.proposals.map((proposal) => (
              <tr
                key={proposal.id}
                class={`huggies-dao-proposal-row ${status_class_fun(proposal.status)}`}
              >
                <td class="huggies-dao-proposal-id">{proposal.id}</td>
                <td class="huggies-dao-proposal-kind">{proposal.kind}</td>
                <td class="huggies-dao-proposal-status-col">
                  <span class="huggies-dao-proposal-status">
                    {proposal.status}
                  </span>
                </td>
                <td class="huggies-dao-proposal-proposer">
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
                <td class="huggies-dao-proposal-votes">
                  {proposal.votes_count}
                </td>
                <td class="huggies-dao-proposal-date">
                  {format_time_fun(proposal.submission_time)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dao.proposals.some((proposal) => proposal.description.length > 0) && (
        <ul class="huggies-dao-proposal-descriptions">
          {dao.proposals
            .filter((proposal) => proposal.description.length > 0)
            .map((proposal) => (
              <li key={proposal.id}>
                <strong>#{proposal.id}</strong> {proposal.description}
              </li>
            ))}
        </ul>
      )}
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
