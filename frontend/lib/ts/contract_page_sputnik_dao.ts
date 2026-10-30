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
// field. that is not a failure, it is "this dao has no proposals" —
// the typed helper reads both shapes as an empty list.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import {
  sputnik_dao_get_config_fun_json,
  sputnik_dao_get_policy_fun_json,
  sputnik_dao_get_proposals_fun_json,
  sputnik_dao_get_available_amount_fun_json,
  sputnik_dao_get_locked_storage_amount_fun_json,
} from "@near-kit-tool-box/fun";
// --- WHY --- the toolbox's own types, not local copies: the toolbox
// already models the contract's proposal kinds as a discriminated
// union and validates the reply with zod. a local copy of the same
// shape would drift from it, and the copy is what threw the kinds'
// own fields away.
import type {
  SPUTNIK_DAO_LAST_ACTION_TYPE,
  SPUTNIK_DAO_POLICY_TYPE,
  SPUTNIK_DAO_PROPOSAL_KIND_TYPE,
  SPUTNIK_DAO_PROPOSAL_TYPE,
} from "@near-kit-tool-box/fun";
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
  // the details of the kind, for the kinds that carry their own
  // content: a Transfer's token, amount and receiver; a ChangeConfig's
  // new name and purpose.
  detail: HUGGIES_DAO_PROPOSAL_DETAIL;
  // the block heights the proposal's actions landed in, when the
  // contract logged them.
  block_heights: string[];
}
// ========================================
// the parts of a proposal that only some kinds carry.
//
// --- WHY --- one shape for every kind and not one per kind: the page
// shows the detail the proposal has, and a proposal of a kind the page
// does not know about shows nothing rather than breaking. each field is
// empty when the kind does not have it.
export interface HUGGIES_DAO_PROPOSAL_DETAIL {
  // the token a Transfer moves. empty for every other kind.
  token_id: string;
  // the token's display symbol, when the registry knows it.
  token_symbol: string;
  // the raw amount, in the token's own smallest unit.
  amount: string;
  // the amount read with the token's decimals, as a human figure.
  amount_text: string;
  // who a Transfer sends to, or who a FunctionCall calls.
  receiver_id: string;
  // the message a Transfer carries.
  msg: string;
  // the new name a ChangeConfig sets.
  config_name: string;
  // the new purpose a ChangeConfig sets.
  config_purpose: string;
  // the theme a ChangeConfig sets, read out of its base64 metadata.
  config_color: string;
  config_logo: string;
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
//
// the id, the symbol and the decimals live in lib/ts/token_near.ts,
// next to the other facts about the chain's own token.
import {
  HUGGIES_NEAR_DECIMALS as HUGGIES_DAO_NEAR_DECIMALS,
  HUGGIES_NEAR_ID,
  HUGGIES_NEAR_SYMBOL as HUGGIES_DAO_NEAR_SYMBOL,
} from "./token_near";
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
//
// --- WHY --- the policy is the toolbox's own type and not `unknown`:
// `SPUTNIK_DAO_POLICY_TYPE` says the roles are a list of
// `SPUTNIK_DAO_ROLE_TYPE`, and that a role's `kind` is either a
// `Group` of accounts or the bare string `"Everyone"`. so the members
// are read with their real types and there is no cast.
function parse_roles_fun(
  policy: SPUTNIK_DAO_POLICY_TYPE | null,
): HUGGIES_DAO_ROLE[] {
  if (policy === null) return [];
  const parsed: HUGGIES_DAO_ROLE[] = [];
  for (const role of policy.roles) {
    // the role's members live under `kind`, which is an enum. `Group`
    // holds the accounts; `Everyone` is a bare string and means any
    // account can act in the role, so it has no member list at all.
    //
    // --- WHY --- the check is inline and not a boolean above it:
    // typescript narrows `role.kind` from the check itself, and a
    // boolean would lose that.
    const group = typeof role.kind === "string" ? null : role.kind.Group;
    parsed.push({
      name: role.name.length > 0 ? role.name : "unknown",
      kind: group === null ? "everyone" : "group",
      members: group ?? [],
      permissions: role.permissions,
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
//
// --- WHY --- the kind is the toolbox's own union and not `unknown`:
// `SPUTNIK_DAO_PROPOSAL_KIND_TYPE` is a discriminated union over every
// kind the contract can answer with, so `if ("Transfer" in kind)`
// narrows it and the fields are read with their real types. there is
// no `Object.keys()` guesswork and no cast.
function kind_summary_fun(
  kind: SPUTNIK_DAO_PROPOSAL_KIND_TYPE,
  scales: HUGGIES_DAO_TOKEN_SCALES,
): string {
  if (!is_object_kind_fun(kind)) return "signal vote";
  if ("Transfer" in kind) {
    const body = kind.Transfer;
    // --- WHY --- an empty token id means NEAR. the contract uses ""
    // for the chain's own token.
    const token =
      body.token_id.length > 0 ? body.token_id : HUGGIES_NEAR_ID;
    const decimals = scales.decimals.get(token) ?? HUGGIES_DAO_NEAR_DECIMALS;
    const symbol =
      scales.symbols.get(token) ??
      (token === HUGGIES_NEAR_ID
        ? HUGGIES_DAO_NEAR_SYMBOL
        : token.split(".")[0]);
    const amount_text = format_amount_fun(body.amount, decimals);
    return `${amount_text} ${symbol} → ${body.receiver_id}`;
  }
  if ("FunctionCall" in kind) {
    const body = kind.FunctionCall;
    const count = body.actions.length;
    return `call ${body.receiver_id}${count > 1 ? ` (${count} actions)` : ""}`;
  }
  if ("AddMemberToRole" in kind) {
    const body = kind.AddMemberToRole;
    return `${body.member_id} → ${body.role}`;
  }
  if ("RemoveMemberFromRole" in kind) {
    const body = kind.RemoveMemberFromRole;
    return `${body.member_id} → ${body.role}`;
  }
  if ("ChangeConfig" in kind) {
    const name = kind.ChangeConfig.config.name;
    return name.length > 0 ? name : "new config";
  }
  if ("ChangePolicy" in kind) {
    return "policy change";
  }
  if ("ChangePolicyAddOrUpdateRole" in kind) {
    return `role ${kind.ChangePolicyAddOrUpdateRole.role.name}`;
  }
  if ("ChangePolicyRemoveRole" in kind) {
    return `role ${kind.ChangePolicyRemoveRole.role}`;
  }
  if ("ChangePolicyUpdateDefaultVotePolicy" in kind) {
    return "policy change";
  }
  if ("ChangePolicyUpdateParameters" in kind) {
    return "policy change";
  }
  if ("AddBounty" in kind) {
    const description = kind.AddBounty.bounty.description;
    return description.length > 0 ? description : "bounty";
  }
  if ("UpgradeSelf" in kind) {
    return "upgrade";
  }
  if ("UpgradeRemote" in kind) {
    return "upgrade";
  }
  if ("BountyDone" in kind) {
    return `bounty ${kind.BountyDone.bounty_id} done`;
  }
  if ("SetStakingContract" in kind) {
    return `staking → ${kind.SetStakingContract.staking_id}`;
  }
  if ("FactoryInfoUpdate" in kind) {
    return `factory → ${kind.FactoryInfoUpdate.factory_info.factory_id}`;
  }
  return "proposal";
}
// ========================================
// --- DETAIL ----------------------------
// an empty detail, for the kinds that carry nothing of their own.
function empty_detail_fun(): HUGGIES_DAO_PROPOSAL_DETAIL {
  return {
    token_id: "",
    token_symbol: "",
    amount: "",
    amount_text: "",
    receiver_id: "",
    msg: "",
    config_name: "",
    config_purpose: "",
    config_color: "",
    config_logo: "",
  };
}
// ========================================
// read the theme out of a config's base64 metadata.
//
// --- WHY --- the metadata is base64 JSON, not plain text: it holds the
// dao's primary colour and its logo, which are the parts of a
// ChangeConfig the reader actually wants to see. a base64 blob in the
// card tells them nothing.
function read_config_theme_fun(metadata: unknown): {
  color: string;
  logo: string;
} {
  const empty = { color: "", logo: "" };
  if (typeof metadata !== "string" || metadata.length === 0) return empty;
  try {
    const decoded = atob(metadata);
    const parsed: unknown = JSON.parse(decoded);
    if (typeof parsed !== "object" || parsed === null) return empty;
    const record = parsed as Record<string, unknown>;
    const color = record.primaryColor;
    const logo = record.flagLogo;
    return {
      color: typeof color === "string" ? color : "",
      logo: typeof logo === "string" ? logo : "",
    };
  } catch {
    // --- WHY --- a metadata blob the page cannot read is not an
    // error: the proposal is still a proposal, and the rest of it
    // still shows.
    return empty;
  }
}
// ========================================
// read the details a kind carries into their own fields.
//
// --- WHY --- the summary is a sentence and this is the data behind it.
// the summary reads "20.1M SHIT → sleet.near", which loses the token
// id and the exact amount. the page shows both: the sentence to read
// and the fields to check.
//
// --- WHY --- the kind is the toolbox's union: the fields are read
// with their real types, and a kind the page does not know about
// simply leaves the detail empty.
function kind_detail_fun(
  kind: SPUTNIK_DAO_PROPOSAL_KIND_TYPE,
  scales: HUGGIES_DAO_TOKEN_SCALES,
): HUGGIES_DAO_PROPOSAL_DETAIL {
  const detail = empty_detail_fun();
  if (!is_object_kind_fun(kind)) return detail;

  if ("Transfer" in kind) {
    const body = kind.Transfer;
    // --- WHY --- an empty token id means NEAR. the contract uses ""
    // for the chain's own token.
    const token = body.token_id.length > 0 ? body.token_id : HUGGIES_NEAR_ID;
    const decimals = scales.decimals.get(token) ?? HUGGIES_DAO_NEAR_DECIMALS;
    const symbol =
      scales.symbols.get(token) ??
      (token === HUGGIES_NEAR_ID
        ? HUGGIES_DAO_NEAR_SYMBOL
        : token.split(".")[0]);
    detail.token_id = body.token_id;
    detail.token_symbol = symbol;
    detail.amount = body.amount;
    detail.amount_text = format_amount_fun(body.amount, decimals);
    detail.receiver_id = body.receiver_id;
    detail.msg = body.msg ?? "";
    return detail;
  }
  if ("FunctionCall" in kind) {
    detail.receiver_id = kind.FunctionCall.receiver_id;
    return detail;
  }
  if ("AddMemberToRole" in kind) {
    detail.receiver_id = kind.AddMemberToRole.member_id;
    detail.msg = kind.AddMemberToRole.role;
    return detail;
  }
  if ("RemoveMemberFromRole" in kind) {
    detail.receiver_id = kind.RemoveMemberFromRole.member_id;
    detail.msg = kind.RemoveMemberFromRole.role;
    return detail;
  }
  if ("ChangeConfig" in kind) {
    const config = kind.ChangeConfig.config;
    detail.config_name = config.name;
    detail.config_purpose = config.purpose;
    const theme = read_config_theme_fun(config.metadata);
    detail.config_color = theme.color;
    detail.config_logo = theme.logo;
    return detail;
  }
  return detail;
}
// ========================================
// read the block heights the contract logged for a proposal.
//
// --- WHY --- these are the blocks the proposal's actions landed in, so
// they say WHEN it really happened — which can be long after it was
// submitted.
function parse_block_heights_fun(
  log: ReadonlyArray<SPUTNIK_DAO_LAST_ACTION_TYPE> | undefined,
): string[] {
  if (!Array.isArray(log)) return [];
  const heights: string[] = [];
  for (const entry of log) {
    if (typeof entry.block_height === "string" && entry.block_height.length > 0)
      heights.push(entry.block_height);
  }
  return heights;
}
// ========================================
// read the proposals out of the contract's reply.
//
// --- WHY --- the reply is already typed and already validated: the
// toolbox's getter parses it with zod against
// `SPUTNIK_DAO_PROPOSAL_TYPE`. so this only reads the toolbox's own
// fields and adds the two the page computes — the summary and the
// detail. there is nothing to re-derive and nothing to cast.
function parse_proposals_fun(
  proposals: ReadonlyArray<SPUTNIK_DAO_PROPOSAL_TYPE>,
  scales: HUGGIES_DAO_TOKEN_SCALES,
): HUGGIES_DAO_PROPOSAL[] {
  const parsed: HUGGIES_DAO_PROPOSAL[] = [];
  for (const proposal of proposals) {
    // the vote counts are `[yes, no, spam]` per role. the contract
    // sends them as strings, so they are read as numbers here and the
    // page can count them.
    const counts: Record<string, [number, number, number]> = {};
    for (const [role, value] of Object.entries(proposal.vote_counts)) {
      counts[role] = [
        to_finite_number_fun(value[0]),
        to_finite_number_fun(value[1]),
        to_finite_number_fun(value[2]),
      ];
    }
    const vote_list: Array<{ account_id: string; vote: string }> = [];
    for (const [account_id, vote] of Object.entries(proposal.votes)) {
      vote_list.push({ account_id, vote });
    }
    parsed.push({
      id: proposal.id,
      proposer: proposal.proposer,
      description: proposal.description,
      kind: proposal_kind_name_fun(proposal.kind),
      kind_summary: kind_summary_fun(proposal.kind, scales),
      status: proposal.status,
      vote_counts: counts,
      votes: vote_list,
      votes_count: vote_list.length,
      submission_time: proposal.submission_time,
      detail: kind_detail_fun(proposal.kind, scales),
      block_heights: parse_block_heights_fun(proposal.last_actions_log),
    });
  }
  return parsed;
}
// ========================================
// a proposal kind that carries an object body.
//
// --- WHY --- one member of the union is a bare string (`"Vote"`), so
// `"Transfer" in kind` leaves the string in the false branch and
// typescript cannot read a field off it. this guard takes the string
// out first, and every field read after it is on an object kind.
//
// --- WHY --- the guard is not a cast: it checks the one thing that
// tells the two apart, and the fields it returns are the toolbox's
// own types.
function is_object_kind_fun(
  kind: SPUTNIK_DAO_PROPOSAL_KIND_TYPE,
): kind is Exclude<SPUTNIK_DAO_PROPOSAL_KIND_TYPE, string> {
  return typeof kind === "object" && kind !== null;
}
// ========================================
// the name of a proposal's kind.
//
// --- WHY --- the union's members are named by their keys, and one of
// them is a bare string (`"Vote"`). this reads the name without
// casting the whole union away.
function proposal_kind_name_fun(
  kind: SPUTNIK_DAO_PROPOSAL_KIND_TYPE,
): string {
  if (typeof kind === "string") return kind;
  return Object.keys(kind)[0] ?? "unknown";
}
// ========================================
// --- LOAD -------------------------------
// read one dao's config, policy and proposals.
async function load_dao_fun(dao_id: string): Promise<HUGGIES_DAO_INFO> {
  const errors: string[] = [];
  const near = near_kit_client();

  // the contract reads run together, so the page is as slow as its
  // slowest one rather than the sum of the four.
  //
  // --- WHY --- the typed helpers are used here, not the generic
  // view helper: each one names the fields it reads and validates
  // the answer. `get_proposals` also reads a DAO with no proposals
  // as an empty list, so it never lands in `errors`.
  const [config, policy, proposals, available, locked] = await Promise.all([
    sputnik_dao_get_config_fun_json(near, dao_id).catch((err: unknown) => {
      errors.push(
        `config: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }),
    sputnik_dao_get_policy_fun_json(near, dao_id).catch((err: unknown) => {
      errors.push(
        `policy: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }),
    sputnik_dao_get_proposals_fun_json(near, dao_id, 0, 100).catch(
      (err: unknown) => {
        errors.push(
          `proposals: ${err instanceof Error ? err.message : String(err)}`,
        );
        return [];
      },
    ),
    sputnik_dao_get_available_amount_fun_json(near, dao_id).catch(
      (err: unknown) => {
        errors.push(
          `available amount: ${err instanceof Error ? err.message : String(err)}`,
        );
        return "";
      },
    ),
    sputnik_dao_get_locked_storage_amount_fun_json(near, dao_id).catch(
      (err: unknown) => {
        errors.push(
          `locked amount: ${err instanceof Error ? err.message : String(err)}`,
        );
        return "";
      },
    ),
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
  proposals: ReadonlyArray<SPUTNIK_DAO_PROPOSAL_TYPE>,
): Promise<HUGGIES_DAO_TOKEN_SCALES> {
  const decimals = new Map<string, number>();
  const symbols = new Map<string, string>();

  const token_ids = new Set<string>();
  for (const proposal of proposals) {
    const kind = proposal.kind;
    if (!is_object_kind_fun(kind)) continue;
    if (!("Transfer" in kind)) continue;
    // --- WHY --- an empty token id means NEAR, the chain's own token.
    const token =
      kind.Transfer.token_id.length > 0
        ? kind.Transfer.token_id
        : HUGGIES_NEAR_ID;
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
