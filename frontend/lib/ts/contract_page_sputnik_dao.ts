// ========================================
// the DAO page's ONE load: every fetch the page makes happens here.
//
// read this file to know what the DAO page requests. that is the
// whole point of it.
//
// WHAT THE PAGE REQUESTS
//   1. GET /api/trezu/user/treasuries   the DAOs the signed-in
//      account is a member of. the page's selector lists them, and
//      the page picks one to show.
//   2. near view get_config              the DAO's name and purpose.
//   3. near view get_policy              the DAO's roles and the
//      members in each.
//   4. near view get_proposals           the DAO's proposals.
//   5. near view get_available_amount    the NEAR the DAO can spend.
//
// --- WHY --- the contract is sputnikdao2 v2.3.1. it answers JSON,
// not borsh, so `near.view()` reads it directly.
//
// --- WHY --- the contract's `get_proposals` returns NOTHING for an
// empty list: the rpc answers with `result.error` and no `result`
// field. that is not a failure, it is "this dao has no proposals".
// see DOCS/SPUTNIK_DAO.md.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import { near_kit_contract_view_fun_json } from "../../../middleman/near_kit_tool_box";
import { list_trezu_treasuries_fun } from "./contract_page_trezu_treasuries";
import type { HUGGIES_TREASURY } from "../../../middleman/huggies";
// ========================================
// --- TYPES ------------------------------
// the page's DAO record: what it is called and what it holds.
export interface HUGGIES_DAO_INFO {
  // the dao account, e.g. `huggies.sputnik-dao.near`.
  id: string;
  // the dao's display name, from trezu when it has one.
  name: string;
  // the dao's purpose, from the contract.
  purpose: string;
  // the roles in the policy, and the accounts in each.
  roles: HUGGIES_DAO_ROLE[];
  // the proposals on the dao.
  proposals: HUGGIES_DAO_PROPOSAL[];
  // the NEAR the dao can spend, in yoctoNEAR.
  available_amount: string;
  // the dao's native NEAR balance, in yoctoNEAR.
  native_near_balance: string;
  // one message per thing that failed.
  errors: string[];
}
// ========================================
// one role in the policy, and the accounts in it.
export interface HUGGIES_DAO_ROLE {
  name: string;
  // the accounts in the role. empty for an `Everyone` role.
  members: string[];
  // what the role may do, e.g. `call:AddProposal`.
  permissions: string[];
}
// ========================================
// one proposal on the dao.
export interface HUGGIES_DAO_PROPOSAL {
  id: number;
  proposer: string;
  description: string;
  // the kind of proposal, e.g. `Transfer` or `FunctionCall`.
  kind: string;
  status: string;
  // the votes per role: `[yes, no, spam]`.
  vote_counts: Record<string, [number, number, number]>;
  // how many votes there were in total.
  votes_count: number;
  // when it was submitted, as a unix timestamp in nanoseconds.
  submission_time: string;
}
// ========================================
// --- HELPERS ----------------------------
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// the display name of a treasury, or its id when trezu has no name.
function treasury_name_fun(treasury: HUGGIES_TREASURY): string {
  const name = treasury.config?.name;
  return typeof name === "string" && name.length > 0 ? name : treasury.daoId;
}
// ========================================
// the DAOs an account is a member of.
//
// --- WHY --- `isMember` and the hidden check are applied even though
// trezu already filters: the endpoint's contract may widen, and a dao
// the reader is not a member of is not one they can act in. a hidden
// treasury is one the account chose to hide, so it stays out of the
// list too.
function member_treasuries_fun(
  treasuries: ReadonlyArray<HUGGIES_TREASURY>,
): HUGGIES_TREASURY[] {
  return treasuries.filter(
    (treasury) =>
      treasury.isMember === true &&
      treasury.isHidden !== true &&
      treasury.isConfidential !== true,
  );
}
// ========================================
// --- POLICY -----------------------------
// read the roles and their members out of the policy.
function parse_roles_fun(value: unknown): HUGGIES_DAO_ROLE[] {
  if (typeof value !== "object" || value === null) return [];
  const roles = (value as { roles?: unknown }).roles;
  if (!Array.isArray(roles)) return [];
  const parsed: HUGGIES_DAO_ROLE[] = [];
  for (const role of roles) {
    if (typeof role !== "object" || role === null) continue;
    const name = (role as { name?: unknown }).name;
    const kind = (role as { kind?: unknown }).kind;
    const permissions = (role as { permissions?: unknown }).permissions;
    // the role's members live under `kind`, which is an enum: `Group`
    // holds the accounts, `Everyone` means every account can act.
    const group =
      typeof kind === "object" && kind !== null
        ? (kind as { Group?: unknown }).Group
        : undefined;
    const members = Array.isArray(group)
      ? group.filter((member): member is string => typeof member === "string")
      : [];
    parsed.push({
      name: typeof name === "string" ? name : "unknown",
      members,
      permissions: Array.isArray(permissions)
        ? permissions.filter(
            (permission): permission is string =>
              typeof permission === "string",
          )
        : [],
    });
  }
  return parsed;
}
// ========================================
// --- PROPOSALS -------------------------
// read the proposals out of the contract's reply.
function parse_proposals_fun(value: unknown): HUGGIES_DAO_PROPOSAL[] {
  if (!Array.isArray(value)) return [];
  const parsed: HUGGIES_DAO_PROPOSAL[] = [];
  for (const proposal of value) {
    if (typeof proposal !== "object" || proposal === null) continue;
    const id = (proposal as { id?: unknown }).id;
    if (typeof id !== "number") continue;
    const kind = (proposal as { kind?: unknown }).kind;
    const kind_name =
      typeof kind === "object" && kind !== null
        ? (Object.keys(kind)[0] ?? "unknown")
        : "unknown";
    const vote_counts = (proposal as { vote_counts?: unknown }).vote_counts;
    const votes = (proposal as { votes?: unknown }).votes;
    const counts: Record<string, [number, number, number]> = {};
    if (typeof vote_counts === "object" && vote_counts !== null) {
      for (const [role, value] of Object.entries(
        vote_counts as Record<string, unknown>,
      )) {
        if (!Array.isArray(value)) continue;
        counts[role] = [
          to_finite_number_fun(value[0]),
          to_finite_number_fun(value[1]),
          to_finite_number_fun(value[2]),
        ];
      }
    }
    parsed.push({
      id,
      proposer:
        typeof (proposal as { proposer?: unknown }).proposer === "string"
          ? (proposal as { proposer: string }).proposer
          : "",
      description:
        typeof (proposal as { description?: unknown }).description === "string"
          ? (proposal as { description: string }).description
          : "",
      kind: kind_name,
      status:
        typeof (proposal as { status?: unknown }).status === "string"
          ? (proposal as { status: string }).status
          : "unknown",
      vote_counts: counts,
      votes_count:
        typeof votes === "object" && votes !== null
          ? Object.keys(votes).length
          : 0,
      submission_time:
        typeof (proposal as { submission_time?: unknown }).submission_time ===
        "string"
          ? (proposal as { submission_time: string }).submission_time
          : "",
    });
  }
  return parsed;
}
// ========================================
// --- LOAD -------------------------------
// read one dao's config, policy and proposals.
async function load_dao_fun(dao_id: string): Promise<HUGGIES_DAO_INFO> {
  const errors: string[] = [];
  const near = near_kit_client();

  // the three contract reads run together, so the page is as slow as
  // its slowest one rather than the sum of the three.
  const [config, policy, proposals, available, account] = await Promise.all([
    near_kit_contract_view_fun_json<Record<string, unknown>>(
      near,
      dao_id,
      "get_config",
    ).catch((err: unknown) => {
      errors.push(
        `config: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }),
    near_kit_contract_view_fun_json<unknown>(near, dao_id, "get_policy").catch(
      (err: unknown) => {
        errors.push(
          `policy: ${err instanceof Error ? err.message : String(err)}`,
        );
        return null;
      },
    ),
    near_kit_contract_view_fun_json<unknown>(near, dao_id, "get_proposals", {
      from_index: 0,
      limit: 100,
    }).catch((err: unknown) => {
      // --- WHY --- an empty proposal list makes the contract answer
      // with an error rather than an empty array. that is "no
      // proposals", not a failure, so it is not collected as one.
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("no result")) {
        errors.push(`proposals: ${message}`);
      }
      return [];
    }),
    near_kit_contract_view_fun_json<string>(
      near,
      dao_id,
      "get_available_amount",
    ).catch((err: unknown) => {
      errors.push(
        `available amount: ${err instanceof Error ? err.message : String(err)}`,
      );
      return "";
    }),
    near.rpc.getAccount(dao_id).catch((err: unknown) => {
      errors.push(
        `native near balance: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }),
  ]);

  const config_name = config?.name;
  const config_purpose = config?.purpose;

  return {
    id: dao_id,
    name:
      typeof config_name === "string" && config_name.length > 0
        ? config_name
        : dao_id,
    purpose: typeof config_purpose === "string" ? config_purpose : "",
    roles: parse_roles_fun(policy),
    proposals: parse_proposals_fun(proposals),
    available_amount: available ?? "",
    native_near_balance: account?.amount ?? "",
    errors,
  };
}
// ========================================
// --- PUBLIC ---------------------------
// the page's load surface. one call per thing the page loads.
export const HUGGIES_CONTRACT_SPUTNIK_DAO_PAGE = {
  load_dao: load_dao_fun,
  list_dao_treasuries: async (
    account_id: string,
  ): Promise<HUGGIES_TREASURY[]> =>
    member_treasuries_fun(await list_trezu_treasuries_fun(account_id)),
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
