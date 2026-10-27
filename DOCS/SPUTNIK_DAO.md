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

`kind` is an enum: `Group` (a list of accounts) or `Everyone`.

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
