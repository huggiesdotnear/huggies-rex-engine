# SPUTNIK DAO v2 — verified contract shape

probed live against mainnet on 2026-10-27. the contract is
`sputnikdao2` v2.3.1 (`near-daos/sputnik-dao-contract` @ `2b0f34a`).

## the account

a DAO is `<name>.sputnik-dao.near`. the page must be given a REAL dao
account. `sputnik-dao.near` is the FACTORY, not a dao — calling it
fails with `MethodResolveError(MethodNotFound)` for every method.

real daos:

- `huggies.sputnik-dao.near` — HUGGIES
- `onsocial.sputnik-dao.near` — onsocial
- `sleet.sputnik-dao.near` — SLEET
- `web3stick.sputnik-dao.near` — WEB3STICK

## the methods

all view methods, all called with **JSON** args (the contract is
`#[near(serializers=[borsh, json])]` and near-sdk's json mode is what
`near.view()` uses):

| method                 | args                  | returns                                                                                              |
| ---------------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `get_config`           | `{}`                  | `{name, purpose, metadata}`                                                                          |
| `get_policy`           | `{}`                  | `{roles: [...]}`                                                                                     |
| `get_available_amount` | `{}`                  | `"68302660735259599999998"` (u128 string)                                                            |
| `get_last_proposal_id` | `{}`                  | `"3"` (u64 string) — the NEXT id, not the count                                                      |
| `get_proposals`        | `{from_index, limit}` | `[{id, proposer, description, kind, status, vote_counts, votes, submission_time, last_actions_log}]` |
| `get_bounties`         | `{from_index, limit}` | `[{id, ...}]`                                                                                        |
| `get_factory_info`     | `{}`                  | `{factory_id, auto_update}`                                                                          |
| `get_actions_log`      | `{}`                  | `[{account_id, proposal_id, action, block_height}]`                                                  |
| `version`              | `{}`                  | `"2.3.1"`                                                                                            |

## the shapes

`get_config`:

```json
{
  "name": "HUGGIES",
  "purpose": "managing digital assets",
  "metadata": "<base64 json>"
}
```

the metadata base64 decodes to `{primaryColor, flagLogo}` for the
huggies dao — the same fields trezu returns in the treasury config.

`get_policy` -> roles:

```json
{ "roles": [
  { "name": "Requestor",
    "kind": { "Group": ["sleet.near", "huggies.near"] },
    "permissions": ["call:VoteRemove", "transfer:VoteRemove", ...],
    "vote_policy": { "transfer": {weight_kind, quorum, threshold}, ... } }
]}
```

`kind` is an enum with two shapes:

- `{ "Group": ["a.near", "b.near"] }` — the accounts in the role
- `"Everyone"` — a bare string, meaning any account can act in the
  role. it has NO member list, so there is no way to count its
  members and no way to list them.

`get_proposals` -> proposals:

```json
{ "id": 0,
  "proposer": "greenghost.near",
  "description": "This project was created using ...",
  "kind": { "FunctionCall": { "receiver_id": "social.near",
                              "actions": [{method_name, args, deposit, gas}] } },
  "status": "Approved",
  "vote_counts": { "council": [1, 0, 0] },
  "votes": { "greenghost.near": "Approve" },
  "submission_time": "1727213574427476731" }
```

`kind` is an enum, one of:
`ChangeConfig` `ChangePolicy` `AddMemberToRole` `RemoveMemberFromRole`
`FunctionCall` `UpgradeSelf` `UpgradeRemote` `Transfer`
`SetStakingContract` `AddBounty` `BountyDone` `Vote`
`FactoryInfoUpdate` `ChangePolicyAddOrUpdateRole`
`ChangePolicyRemoveRole` `ChangePolicyUpdateDefaultVotePolicy`
`ChangePolicyUpdateParameters`

`status` is one of:
`InProgress` `Approved` `Rejected` `Removed` `Expired` `Moved` `Failed`

`vote_counts` maps a role name to `[yes, no, spam]`.

### the amount in a Transfer

the `amount` is in the token's own smallest unit, and the contract does
NOT say how many decimals that is. NEAR is 24 decimals and most other
tokens are 18, so guessing reads a $SHIT amount as twenty million
times too small. the decimals come from the token registry —
`HUGGIES_TOKEN_INFO.get([token_id])` — and the registry has no `near`
entry, so NEAR is the 24-decimal constant.

an empty `token_id` means NEAR.

## the members

there is NO contract method that lists every member of a dao. the
policy only holds role -> member lists, and the roles that are open to
everyone name no accounts at all. so the page's member list is the
union of the roles' member lists, and an account in three roles is ONE
member, not three.

--- WHY --- summing the roles' member counts is wrong. on the huggies
dao the roles hold 2 accounts each and the same 2 accounts are in all
three, so the sum reads 6 for a dao with 2 people. the page counts
the accounts, not the role slots.

## the gotchas

1. **the account must be a real dao.** the factory account answers
   nothing useful and the error is a misleading `MethodNotFound`.

2. **`get_proposals` returns NOTHING for an empty list.** the rpc
   returns `result: {error: "wasm execution failed ..."}` with no
   `result` field, so a caller must treat "no result" as "no
   proposals", not as a failure. the actions log shows the proposals
   existed and were removed.

3. **`last_proposal_id` is the next id, not a count.** the contract
   starts it at 0 and increments on every add. a dao whose proposals
   were all removed still reports a non-zero id.

4. **args are JSON, not borsh.** `get_proposals` with borsh u64 args
   panics with `Failed to deserialize input from JSON`.

5. **`get_last_bounty_id` / `get_bounties`** exist but were empty on
   every dao checked.

6. **a proposal is not a transaction.** it is a record in the
   contract's storage. `get_actions_log` gives the trail of
   `AddProposal` / `VoteApprove` actions with their block heights,
   but the contract does not store the transaction hashes.

## the archive rpc

the archival rpc returns the result as a **byte array**, not base64:

```js
const raw = response.result.result;
const text = Array.isArray(raw)
  ? new TextDecoder().decode(new Uint8Array(raw))
  : new TextDecoder().decode(
      Uint8Array.from(atob(raw), (c) => c.charCodeAt(0)),
    );
```

the standard `rpc.mainnet.near.org` returns base64. both are handled
by the app's own client.

=========================================
<br/>
copyright 2026 by sleet.near
