// ========================================
// data loader for the Sputnik DAO contract page.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import { contract_view_fun } from "./contract_view";
// ========================================
export interface HUGGIES_SPUTNIK_ROLE {
  name: string;
  members: string[];
  permissions: string[];
}
export interface HUGGIES_SPUTNIK_PROPOSAL {
  id: number;
  proposer: string;
  description: string;
  status: string;
  submission_time: string;
}
export interface HUGGIES_SPUTNIK_DATA {
  config: Record<string, unknown>;
  roles: HUGGIES_SPUTNIK_ROLE[];
  proposals: HUGGIES_SPUTNIK_PROPOSAL[];
  native_near_balance: string;
  available_amount: string;
  errors: string[];
}
// ========================================
// derive role members from policy Group roles.
function parse_roles_fun(value: unknown): HUGGIES_SPUTNIK_ROLE[] {
  if (typeof value !== "object" || value === null) return [];
  const roles = (value as { roles?: unknown }).roles;
  if (!Array.isArray(roles)) return [];
  const parsed: HUGGIES_SPUTNIK_ROLE[] = [];
  for (const role of roles) {
    if (typeof role !== "object" || role === null) continue;
    const name = (role as { name?: unknown }).name;
    const kind = (role as { kind?: unknown }).kind;
    const permissions = (role as { permissions?: unknown }).permissions;
    const group =
      typeof kind === "object" && kind !== null
        ? (kind as { Group?: unknown }).Group
        : undefined;
    parsed.push({
      name: typeof name === "string" ? name : "unknown",
      members: Array.isArray(group)
        ? group.filter((member): member is string => typeof member === "string")
        : [],
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
// parse Sputnik proposal summaries defensively.
function parse_proposals_fun(value: unknown): HUGGIES_SPUTNIK_PROPOSAL[] {
  if (!Array.isArray(value)) return [];
  const parsed: HUGGIES_SPUTNIK_PROPOSAL[] = [];
  for (const proposal of value) {
    if (typeof proposal !== "object" || proposal === null) continue;
    const id = (proposal as { id?: unknown }).id;
    const proposer = (proposal as { proposer?: unknown }).proposer;
    const description = (proposal as { description?: unknown }).description;
    const status = (proposal as { status?: unknown }).status;
    const submission_time = (proposal as { submission_time?: unknown })
      .submission_time;
    if (typeof id !== "number") continue;
    parsed.push({
      id,
      proposer: typeof proposer === "string" ? proposer : "",
      description: typeof description === "string" ? description : "",
      status: typeof status === "string" ? status : "unknown",
      submission_time:
        typeof submission_time === "string" ? submission_time : "",
    });
  }
  return parsed;
}
// ========================================
// load a Sputnik DAO's config, policy members, proposals, and balances.
export async function load_sputnik_dao_page_fun(
  dao_id: string,
  account_id: string | null,
): Promise<HUGGIES_SPUTNIK_DATA> {
  const errors: string[] = [];
  let config: Record<string, unknown> = {};
  let roles: HUGGIES_SPUTNIK_ROLE[] = [];
  let proposals: HUGGIES_SPUTNIK_PROPOSAL[] = [];
  let native_near_balance = "";
  let available_amount = "";

  try {
    config = await contract_view_fun<Record<string, unknown>>(
      dao_id,
      "get_config",
    );
  } catch (err) {
    errors.push(`config: ${err instanceof Error ? err.message : String(err)}`);
  }
  try {
    roles = parse_roles_fun(
      await contract_view_fun<unknown>(dao_id, "get_policy"),
    );
  } catch (err) {
    errors.push(`policy: ${err instanceof Error ? err.message : String(err)}`);
  }
  try {
    proposals = parse_proposals_fun(
      await contract_view_fun<unknown>(dao_id, "get_proposals", {
        from_index: 0,
        limit: 100,
      }),
    );
  } catch (err) {
    errors.push(
      `proposals: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (account_id !== null) {
    try {
      const account = await near_kit_client().rpc.getAccount(dao_id);
      native_near_balance = account.amount;
    } catch (err) {
      errors.push(
        `native near balance: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    try {
      available_amount = await contract_view_fun<string>(
        dao_id,
        "get_available_amount",
      );
    } catch (err) {
      errors.push(
        `available amount: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  return {
    config,
    roles,
    proposals,
    native_near_balance,
    available_amount,
    errors,
  };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
