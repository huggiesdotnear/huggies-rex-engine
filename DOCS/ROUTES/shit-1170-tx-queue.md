# SHIT-1170 TX QUEUE

`POST /api/shit-1170/tx-queue` - queue a batch of transactions.

`GET /api/shit-1170/tx-queue` - the queue list, filterable.

the agent queues, the user signs, the queue records what happened.

## THE MODEL

a queued tx is **WHAT, WHEN, WHY, WHO, HOW**.

- **WHAT** - what the transactions do, in words
- **WHEN** - when they should happen, in words, and optionally at a
  machine-readable moment
- **WHY** - why the user wants them
- **WHO** - the accounts the batch is for
- **HOW** - the function calls themselves

a queue is a **BATCH** of transactions, not one transaction. the agent
queues a swap, and that swap needs three function calls - a deposit, the
swap itself, and a withdrawal - so they go in together under one
`queue_id`, and the user signs them **as one batch, in one wallet
popup**.

the model is three levels deep:

```
a QUEUE  (queue_id)          what / when / why
  └── a TRANSACTION          contractId / method / args / gas / deposit
        └── an ACCOUNT ROW    accountId / status / txHash
```

## THE STATUS

there are four states, and they live **only on the account row**:

- `pending` - on the queue, not signed yet
- `sent` - signed and sent, the outcome is not known yet
- `succeeded` - it went through
- `failed` - it did not work

> --- WHY --- the status lives ONLY on the account row. it is the one
> place where the truth is. a transaction is not "sent" or "failed" on
> its own - it is sent BY an account, and each account's send is its own
> transaction with its own hash and its own outcome. two accounts sending
> the same queued transaction produce two different on-chain
> transactions, and either can succeed while the other fails.

> --- WHY --- there is NO queue-level status and NO transaction-level
> status. a queue is never done. at any moment another account can
> decide they want to send it, and they join. a "is this queue done"
> badge would be a lie the moment somebody new signs it. the ui does not
> need a done badge - it needs to know, per account, whether that
> account has sent it.

> --- WHY --- `sent` is a real state and not a leftover. the outcome is
> not known at the moment the hash is written - the frontend reads it
> off the chain later and reports it back. so `sent` means "it went out
> and nobody knows how it went yet".

## THE TWO RULES

there are two rules here, and they pull in opposite directions.

**the NAMING rule** - the agent queues a tx and names the accounts it is
for. the agent may name **ONLY accounts whose api key it holds**.

**the SIGNING rule** - a user sees a tx in their feed and signs it. any
signed-in user may sign **any** queue they can see.

> --- WHY --- the naming rule exists. the WHO list is what puts a tx in
> somebody's feed. if an agent could name any account id it liked, agent
> A could fill agent B's users' feeds with txs they never asked for -
> and the ui filters by account, so those users would keep seeing them.
> one agent spamming another agent's users through the queue is exactly
> what this stops. so the agent's WHO list is its OWN users, and only
> its own users.

> --- WHY --- the signing rule stays open. the queue is an open offer. a
> user who sees a tx may send it, and their account joins the WHO list.
> that is a user acting for themselves with their own key - no agent is
> putting it in front of them, they found it and chose it.

so the queue never becomes a spam channel between agents, and it never
becomes a closed club either.

the naming check is one query: does the `api_keys` table have a row for
that account. the api_keys table IS the record of the keys that were
issued, and an agent holds the key it was given - so a row in it is the
agent saying "this account is mine".

the agent's OWN account is always allowed to name itself.

## THE CAP

a batch holds at most **50** transactions. more than 50 is a `400`.

> --- WHY --- fifty. the wallet signs the whole batch in ONE popup, and a
> popup with two hundred transactions is unreadable and slow.

## THE POST

### the body

```json
{
  "what": "swap 100 USDC for NEAR on the ref finance dex",
  "when": "when the price is right",
  "why": "you said to move half your usdc into near",
  "whenAt": 1772666400000,
  "transactions": [
    {
      "contractId": "ref.finance.near",
      "method": "ft_swap",
      "args": {
        "receiver_id": "alice.near",
        "amount": "100000000",
        "token_in": "usdt.tether-token.near",
        "token_out": "wrap.near"
      },
      "gas": "30000000000000",
      "deposit": "1"
    },
    {
      "contractId": "ref.finance.near",
      "method": "ft_resolve_transfer",
      "args": {
        "token_id": "usdt.tether-token.near",
        "receiver_id": "alice.near",
        "amount": "100000000"
      },
      "gas": "30000000000000",
      "deposit": "1"
    }
  ],
  "accounts": ["alice.near", "bob.near"]
}
```

`transactions` is a LIST. one entry is a batch of one. the order in the
list is the order the transactions are sent in, and it becomes the
`position` column.

`args` is a json OBJECT on the wire, not a string. it may be left out,
and then it is an empty object - a call with no arguments is an
ordinary thing.

`accounts` is the WHO - the accounts the agent is queuing this for. it
is **optional**, and **every account in it must be one the agent holds
an api key for** - the NAMING rule. an account the agent has no key
for is refused with a `400`, so an agent cannot drop a tx into somebody
else's feed.

those accounts get rows with `status = pending`, so they see the tx in
their feed before anyone has signed it.

> --- WHY --- `what`, `when` and `why` are all optional. the agent may
> know the WHAT and not the WHY. an agent that had to fill all three
> would make one up, and a made-up WHY is worse than no WHY.

> --- WHY --- `when` is text AND `whenAt` is a timestamp. most of the
> time "when" is a CONDITION and not a moment - "when the price is
> right", "after this proposal passes". a string can say that and a
> timestamp cannot. but some requests really are "at 10:00 on friday",
> and that needs a number the machine can sort on and the ui can count
> down to. so both, and `whenAt` is null when there is no moment.

> --- WHY --- the args must be a json OBJECT. the near-kit toolbox takes
> a json object of arguments, and the frontend hands the transactions
> straight to `generic_contract_call_wallet`. an array or a bare string
> is not a set of named arguments, and the call would fail on chain.

### the answer

`201` with the queued batch:

```json
{
  "queueId": "8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11",
  "what": "swap 100 USDC for NEAR on the ref finance dex",
  "when": "when the price is right",
  "why": "you said to move half your usdc into near",
  "whenAt": null,
  "transactions": [
    {
      "txId": "1a2b3c4d-0000-0000-0000-000000000001",
      "position": 0,
      "contractId": "ref.finance.near",
      "method": "ft_swap",
      "args": { "receiver_id": "alice.near" },
      "gas": "30000000000000",
      "deposit": "1",
      "accounts": [
        { "accountId": "alice.near", "status": "pending", "txHash": null },
        { "accountId": "bob.near", "status": "pending", "txHash": null }
      ]
    }
  ],
  "accounts": [
    { "accountId": "alice.near", "status": "pending", "txHash": null },
    { "accountId": "bob.near", "status": "pending", "txHash": null }
  ],
  "createdAt": 1772666000000,
  "updatedAt": 1772666000000
}
```

the queue's own `accounts` list is the WHO across the whole batch - the
union of the transactions' account rows, **deduped by account id**. a
batch of three calls has three account rows for alice, and the queue's
list holds ONE entry for alice, not three.

a transaction's `accounts` list is the same rows under that transaction,
with that transaction's status and hash for each.

> --- WHY --- the row that CARRIES A HASH wins in the queue's list. the
> hash is the fact - it means the account actually sent the
> transaction. a pending row under another transaction of the same batch
> is still the same account, and the sent one is the newer truth.

the answer is read back out of the db, not built from what was just
written. so it is the SAME shape whether it came from the queue route,
the one-batch route or the list route.

### the errors

- `401` - `no_api_key` when the header is missing, or
  `unknown_api_key` when the key is not one of ours
- `400` - `no_transactions` when the batch was empty,
  `too_many_transactions` when it held more than fifty,
  `no_contract_id` or `no_method` when a call was missing one,
  `args_not_an_object` when the args were not a json object, or
  `account_not_named_by_agent` when the `accounts` list named an
  account the agent holds **no api key for** - the NAMING rule
- `500` - `db_unavailable`

> --- WHY --- a SHORTER answer from the naming check means one of the
> accounts was refused, and the WHOLE request is refused. naming one
> account you may not name would still put a tx in somebody's feed, so
> the batch is not written at all.

> --- WHY --- every call is checked BEFORE anything is written. a batch
> that is going to be refused never leaves half of itself in the db.

## THE GET

### the query

```
GET /api/shit-1170/tx-queue?account_id=alice.near&hide_sent=1&limit=50&offset=0
```

the filters are:

- `account_id` - only the queues this account is on
- `hide_sent` - `1` drops the ones this account has sent. it needs
  `account_id`
- `contract_id` - only the queues holding a tx for this contract
- `method` - only the queues holding a tx for this method
- `limit` - default 50, and clamped to 500
- `offset` - default 0

**there is no `status` filter.** the status is per account and per
transaction, and a queue has no global status to filter on.

the query names are snake_case and are matched literally, so
`accountId` is NOT `account_id`.

`hide_sent` takes `1`, `true`, `yes` or `on` for on, and `0`, `false`,
`no` or `off` for off. anything else is read as "off" - it is a filter,
and a filter that is switched on by accident hides the rows the reader
came for.

**`hide_sent` without `account_id` is a `400`.**

> --- WHY --- `hide_sent` needs an account. "has this account sent it" is
> a question about ONE account. a queue can be sent by alice and not by
> bob, so there is no single answer to "has this queue been sent". the
> filter therefore names the account it is about, and saying so is
> better than quietly ignoring it and returning the whole list.

> --- WHY --- the api does the filtering and not the frontend. the
> frontend would have to fetch every queue, read every account row, and
> work out which ones the reader has sent - and then throw most of them
> away. the api can do it in the query, so the reader gets the twenty
> they asked for and not two hundred they did not.

> --- WHY --- the list is OPEN. anyone with an api key can list the
> queues. a queue is an open offer, and hiding it would defeat the
> point. the key is still required - the list is open to people who
> HAVE one, not to everybody.

### the answer

`200`:

```json
{
  "items": [ ...one batch each... ],
  "total": 1
}
```

each item is the same shape as the `201` answer above.

**the `total` is the count BEFORE `limit` and `offset`.** it is how many
queues matched, so a client knows how many pages there are.

### the errors

- `401` - `no_api_key` or `unknown_api_key`
- `400` - `hide_sent_without_account` when `hide_sent` came without an
  `account_id`
- `500` - `db_unavailable`

## ONE BATCH

`GET /api/shit-1170/tx-queue/{queue_id}` - one queued batch.

the answer is the same shape as one item of the list: the queue, its
transactions in `position` order, and the WHO across the batch.

- `401` - `no_api_key` or `unknown_api_key`
- `404` - `no_such_queue` when there is no queue with that id
- `500` - `db_unavailable`, or `args_broken` when the arguments of the
  queue could not be read back

> --- WHY --- the key is checked FIRST. a caller who cannot prove who
> they are gets nothing, not even the 404 that says whether the queue
> exists.

## CLIENT

the typed client lives in `middleman/src/`, published as
`@huggies/shit-1170-rex-engine-middleman`:

- `api_shit_1170_tx_queue_post(base_url, body, options)`
- `api_shit_1170_tx_queue_get(base_url, query, options)`
- `api_shit_1170_tx_queue_one_get(base_url, queue_id, options)`

the middleman checks the empty batch and the fifty cap before the round
trip, so a caller that goes over gets a clear message instead of a 400
from the wire.

=====================
<br/>
copyright 2026 by sleet.near
