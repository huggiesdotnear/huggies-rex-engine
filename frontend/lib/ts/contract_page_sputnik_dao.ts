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
//   2. GET /balances                    the DAO's own token balances,
//      the same read the account page does.
//   3. near view get_config              the DAO's name and purpose.
//   4. near view get_policy              the DAO's roles and the
//      accounts in each.
//   5. near view get_proposals           the DAO's proposals.
//   6. near view get_available_amount    the NEAR the DAO can spend.
//   7. near view get_locked_storage_amount  the NEAR it holds for
//      storage.
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
import { HUGGIES_TOKEN_INFO } from "./token_info";
import type { TREZU_TREASURY } from "../../../middleman/huggies";
// ========================================
// --- TYPES ------------------------------
// how a role is open. `Group` names the accounts in it; `Everyone`
// means any account can act in it, so it has no member list.
export type HUGGIES_DAO_ROLE_KIND = "group" | "everyone";
// ========================================
// one role in the policy.
export interface HUGGIES_DAO_ROLE {
  name: string;
  // how the role is open.
  kind: HUGGIES_DAO_ROLE_KIND;
  // the accounts in the role. empty for an `everyone` role.
  members: string[];
  // what the role may do, e.g. `call:AddProposal`.
  permissions: string[];
}
// ========================================
// one account in the dao, and the roles it is in.
export interface HUGGIES_DAO_MEMBER {
  account_id: string;
  // the roles this account is in, in the policy's own order.
  roles: string[];
  // every permission those roles grant, de-duplicated, in order.
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
  // what the proposal does, in a sentence: `20.1M $SHIT → sleet.near`.
  kind_summary: string;
  status: string;
  // the votes per role: `[yes, no, spam]`.
  vote_counts: Record<string, [number, number, number]>;
  // who voted, and how.
  votes: Array<{ account_id: string; vote: string }>;
  // how many votes there were in total.
  votes_count: number;
  // when it was submitted, as a unix timestamp in nanoseconds.
  submission_time: string;
}
// ========================================
// the page's DAO record: what it is called and what it holds.
export interface HUGGIES_DAO_INFO {
  // the dao account, e.g. `huggies.sputnik-dao.near`.
  id: string;
  // the dao's display name, from trezu when it has one.
  name: string;
  // the dao's purpose, from the contract.
  purpose: string;
  // the roles in the policy.
  roles: HUGGIES_DAO_ROLE[];
  // every account the policy names, with the roles it is in.
  members: HUGGIES_DAO_MEMBER[];
  // the roles that are open to everyone.
  open_roles: HUGGIES_DAO_ROLE[];
  // the proposals on the dao.
  proposals: HUGGIES_DAO_PROPOSAL[];
  // the NEAR the dao can spend, in yoctoNEAR.
  available_amount: string;
  // the NEAR it holds for storage, in yoctoNEAR.
  locked_amount: string;
  // one message per thing that failed.
  errors: string[];
}
// ========================================
// --- HELPERS ----------------------------
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// the kinds a proposal can be, and the parts of them the page reads.
type HUGGIES_DAO_PROPOSAL_KIND =
  | "ChangeConfig"
  | "ChangePolicy"
  | "AddMemberToRole"
  | "RemoveMemberFromRole"
  | "FunctionCall"
  | "UpgradeSelf"
  | "UpgradeRemote"
  | "Transfer"
  | "SetStakingContract"
  | "AddBounty"
  | "BountyDone"
  | "Vote"
  | "FactoryInfoUpdate"
  | "ChangePolicyAddOrUpdateRole"
  | "ChangePolicyRemoveRole"
  | "ChangePolicyUpdateDefaultVotePolicy"
  | "ChangePolicyUpdateParameters";
// ========================================
// the token amounts in the proposals, and the decimals to read them
// with.
//
// --- WHY --- the contract's `Transfer` amount is in the token's own
// smallest unit, and the contract does not say how many decimals that
// is. the token registry does, so the decimals are asked for once and
// every amount in the page is read with them.
//
// --- WHY --- NEAR is 24 decimals and most other tokens are 18, so
// guessing would read a $SHIT amount as twenty million times too
// small.
interface HUGGIES_DAO_TOKEN_SCALES {
  // the decimals for each token id, for the tokens the proposals move.
  decimals: Map<string, number>;
  // the display symbol for each token id.
  symbols: Map<string, string>;
}
// ========================================
// NEAR is the chain's own token and has no registry entry, so it is
// described here. 24 decimals is the NEAR protocol constant.
const HUGGIES_DAO_NEAR_DECIMALS = 24;
const HUGGIES_DAO_NEAR_SYMBOL = "NEAR";
// ========================================
// format a raw token amount as a short human figure.
function format_amount_fun(raw: string, decimals: number): string {
  const value = Number(raw);
  if (!Number.isFinite(value)) return raw;
  const whole = value / 10 ** decimals;
  if (!Number.isFinite(whole)) return raw;
  if (Number.isInteger(whole)) return whole.toLocaleString();
  return whole.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
// ========================================
// the display name of a treasury, or its id when trezu has no name.
function treasury_name_fun(treasury: TREZU_TREASURY): string {
  const name = treasury.config?.name;
  return typeof name === "string" && name.length > 0 ? name : treasury.daoId;
}
// ========================================
// the daos an account is a member of.
//
// --- WHY --- `isMember` and the hidden check are applied even though
// trezu already filters: the endpoint's contract may widen, and a dao
// the reader is not a member of is not one they can act in. a hidden
// treasury is one the account chose to hide, so it stays out of the
// list too.
function member_treasuries_fun(
  treasuries: ReadonlyArray<TREZU_TREASURY>,
): TREZU_TREASURY[] {
  return treasuries.filter(
    (treasury) =>
      treasury.isMember === true &&
      treasury.isHidden !== true &&
      treasury.isConfidential !== true,
  );
}
// ========================================
// --- POLICY -----------------------------
// read the roles out of the policy.
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
    // the role's members live under `kind`, which is an enum. `Group`
    // holds the accounts; `Everyone` is a bare string and means any
    // account can act in the role, so it has no member list at all.
    const group =
      typeof kind === "object" && kind !== null
        ? (kind as { Group?: unknown }).Group
        : undefined;
    const members = Array.isArray(group)
      ? group.filter((member): member is string => typeof member === "string")
      : [];
    parsed.push({
      name: typeof name === "string" ? name : "unknown",
      kind: Array.isArray(group) ? "group" : "everyone",
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
// --- MEMBERS ---------------------------
// fold the roles into one row per account.
//
// --- WHY --- one row per account, not one row per role: an account can
// be in several roles, and a table that repeats the account for each of
// them makes the reader count the duplicates by hand. the roles the
// account is in become a column.
//
// --- WHY --- the roles that are open to everyone are not rows: they
// name no accounts, so there is nothing to put in one. they are kept
// apart so the page can say they exist.
function fold_members_fun(roles: ReadonlyArray<HUGGIES_DAO_ROLE>): {
  members: HUGGIES_DAO_MEMBER[];
  open_roles: HUGGIES_DAO_ROLE[];
} {
  const open_roles = roles.filter((role) => role.kind === "everyone");
  const by_account = new Map<string, HUGGIES_DAO_MEMBER>();
  for (const role of roles) {
    for (const account_id of role.members) {
      const member = by_account.get(account_id);
      if (member === undefined) {
        by_account.set(account_id, {
          account_id,
          roles: [role.name],
          permissions: [...role.permissions],
        });
        continue;
      }
      member.roles.push(role.name);
      for (const permission of role.permissions) {
        if (!member.permissions.includes(permission)) {
          member.permissions.push(permission);
        }
      }
    }
  }
  // the accounts in the policy's own order: the first role's members
  // first, then whoever is only in a later role.
  const members = [...by_account.values()];
  return { members, open_roles };
}
// ========================================
// --- PROPOSALS -------------------------
// a one-line summary of what a proposal does.
//
// --- WHY --- the `kind` is the proposal's real content and it is
// structured: a Transfer says how much of which token went to whom, a
// FunctionCall says which contract was called. a row that shows only
// the kind's name says nothing, so the kind is read and summarised.
function kind_summary_fun(
  kind: unknown,
  scales: HUGGIES_DAO_TOKEN_SCALES,
): string {
  if (typeof kind !== "object" || kind === null) return "";
  const name = Object.keys(kind)[0] ?? "";
  const body = (kind as Record<string, unknown>)[name];
  if (typeof body !== "object" || body === null) return name;

  switch (name) {
    case "Transfer": {
      const token_id = (body as { token_id?: unknown }).token_id;
      const receiver_id = (body as { receiver_id?: unknown }).receiver_id;
      const amount = (body as { amount?: unknown }).amount;
      // --- WHY --- an empty token id means NEAR. the contract uses ""
      // for the chain's own token.
      const token =
        typeof token_id === "string" && token_id.length > 0 ? token_id : "near";
      const decimals = scales.decimals.get(token) ?? HUGGIES_DAO_NEAR_DECIMALS;
      const symbol =
        scales.symbols.get(token) ??
        (token === "near" ? HUGGIES_DAO_NEAR_SYMBOL : token.split(".")[0]);
      const amount_text =
        typeof amount === "string" ? format_amount_fun(amount, decimals) : "—";
      const receiver =
        typeof receiver_id === "string" ? receiver_id : "unknown";
      return `${amount_text} ${symbol} → ${receiver}`;
    }
    case "FunctionCall": {
      const receiver_id = (body as { receiver_id?: unknown }).receiver_id;
      const actions = (body as { actions?: unknown }).actions;
      const count = Array.isArray(actions) ? actions.length : 0;
      const receiver =
        typeof receiver_id === "string" ? receiver_id : "unknown";
      return `call ${receiver}${count > 1 ? ` (${count} actions)` : ""}`;
    }
    case "AddMemberToRole":
    case "RemoveMemberFromRole": {
      const member_id = (body as { member_id?: unknown }).member_id;
      const role = (body as { role?: unknown }).role;
      return `${member_id ?? "?"} → ${role ?? "?"}`;
    }
    case "ChangeConfig": {
      const config = (body as { config?: unknown }).config;
      const config_name =
        typeof config === "object" && config !== null
          ? (config as { name?: unknown }).name
          : null;
      return typeof config_name === "string" ? config_name : "new config";
    }
    case "ChangePolicy":
    case "ChangePolicyAddOrUpdateRole":
    case "ChangePolicyRemoveRole":
    case "ChangePolicyUpdateDefaultVotePolicy":
    case "ChangePolicyUpdateParameters":
      return "policy change";
    case "AddBounty": {
      const bounty = (body as { bounty?: unknown }).bounty;
      const description =
        typeof bounty === "object" && bounty !== null
          ? (bounty as { description?: unknown }).description
          : null;
      return typeof description === "string" ? description : "bounty";
    }
    case "UpgradeSelf":
    case "UpgradeRemote":
      return "upgrade";
    case "BountyDone": {
      const bounty_id = (body as { bounty_id?: unknown }).bounty_id;
      return `bounty ${bounty_id ?? "?"} done`;
    }
    case "Vote":
      return "signal vote";
    default:
      return name;
  }
}
// ========================================
// read the proposals out of the contract's reply.
function parse_proposals_fun(
  value: unknown,
  scales: HUGGIES_DAO_TOKEN_SCALES,
): HUGGIES_DAO_PROPOSAL[] {
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
    const vote_list: Array<{ account_id: string; vote: string }> = [];
    if (typeof votes === "object" && votes !== null) {
      for (const [account_id, vote] of Object.entries(
        votes as Record<string, unknown>,
      )) {
        vote_list.push({
          account_id,
          vote: typeof vote === "string" ? vote : "Unknown",
        });
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
      kind_summary: kind_summary_fun(kind, scales),
      status:
        typeof (proposal as { status?: unknown }).status === "string"
          ? (proposal as { status: string }).status
          : "unknown",
      vote_counts: counts,
      votes: vote_list,
      votes_count: vote_list.length,
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

  // the contract reads run together, so the page is as slow as its
  // slowest one rather than the sum of the four.
  const [config, policy, proposals, available, locked] = await Promise.all([
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
    near_kit_contract_view_fun_json<string>(
      near,
      dao_id,
      "get_locked_storage_amount",
    ).catch((err: unknown) => {
      errors.push(
        `locked amount: ${err instanceof Error ? err.message : String(err)}`,
      );
      return "";
    }),
  ]);

  const roles = parse_roles_fun(policy);
  const { members, open_roles } = fold_members_fun(roles);
  const config_name = config?.name;
  const config_purpose = config?.purpose;

  // the tokens the proposals move, and the decimals to read their
  // amounts with.
  const scales = await load_token_scales_fun(proposals);

  return {
    id: dao_id,
    name:
      typeof config_name === "string" && config_name.length > 0
        ? config_name
        : dao_id,
    purpose: typeof config_purpose === "string" ? config_purpose : "",
    roles,
    members,
    open_roles,
    proposals: parse_proposals_fun(proposals, scales),
    available_amount: available ?? "",
    locked_amount: locked ?? "",
    errors,
  };
}
// ========================================
// --- TOKEN SCALES ----------------------
// the decimals and symbols of the tokens the proposals move.
//
// --- WHY --- a Transfer's amount is in the token's own smallest unit
// and the contract does not say how many decimals that is. the token
// registry does, so it is asked once for every token the proposals
// touch and every amount in the page is read with it.
async function load_token_scales_fun(
  proposals: unknown,
): Promise<HUGGIES_DAO_TOKEN_SCALES> {
  const decimals = new Map<string, number>();
  const symbols = new Map<string, string>();
  if (!Array.isArray(proposals)) return { decimals, symbols };

  const token_ids = new Set<string>();
  for (const proposal of proposals) {
    if (typeof proposal !== "object" || proposal === null) continue;
    const kind = (proposal as { kind?: unknown }).kind;
    if (typeof kind !== "object" || kind === null) continue;
    const transfer = (kind as Record<string, unknown>).Transfer;
    if (typeof transfer !== "object" || transfer === null) continue;
    const token_id = (transfer as { token_id?: unknown }).token_id;
    // --- WHY --- an empty token id means NEAR, the chain's own token.
    const token =
      typeof token_id === "string" && token_id.length > 0 ? token_id : "near";
    token_ids.add(token);
  }
  if (token_ids.size === 0) return { decimals, symbols };

  try {
    const info_map = await HUGGIES_TOKEN_INFO.get([...token_ids]);
    for (const [id, info] of info_map) {
      decimals.set(id, info.decimals);
      symbols.set(id, info.symbol);
    }
  } catch {
    // --- WHY --- the amounts are shown with a guess if the registry
    // cannot be read. a wrong scale is better than no proposals.
    for (const id of token_ids) {
      decimals.set(id, HUGGIES_DAO_NEAR_DECIMALS);
      symbols.set(id, id.split(".")[0]);
    }
  }
  return { decimals, symbols };
}
// ========================================
// --- PUBLIC ---------------------------
// the page's load surface. one call per thing the page loads.
export const HUGGIES_CONTRACT_SPUTNIK_DAO_PAGE = {
  load_dao: load_dao_fun,
  list_dao_treasuries: async (account_id: string): Promise<TREZU_TREASURY[]> =>
    member_treasuries_fun(await list_trezu_treasuries_fun(account_id)),
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
