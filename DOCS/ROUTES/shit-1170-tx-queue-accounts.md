# SHIT-1170 TX QUEUE ACCOUNTS

`POST /api/shit-1170/tx-queue/{queue_id}/accounts` - add YOUR OWN
account to a queued batch.

`DELETE /api/shit-1170/tx-queue/{queue_id}/accounts/{account_id}` -
remove YOUR OWN account from a queued batch.

the WHO of a batch is a list of account rows, and these two routes are
how an account joins that list and how it steps off it.

## THE RULE

the api key in the header must belong to that very account. you can only
ever add **yourself**, and you can only ever remove **yourself**.

```
the header's api key -> the account it belongs to == body.accountId
```

if they do not match, `403`.

> --- WHY --- the key must be the account's own. the WHO list is what
> puts a tx in somebody's feed. an account that adds itself is saying
> "I want this one", and that is its own business. an account that adds
> somebody ELSE is putting a tx in somebody else's feed without them
> asking - the same spam the naming rule stops on the agent side.

the delete is the same rule with the account in the path instead of in
the body.

## THE POST

### the body

```json
{ "accountId": "alice.near" }
```

### what it writes

an account row for **every** transaction of the batch, with
`status = pending`.

this is how alice says "I want this one" before she has signed it, and
it puts the tx in her feed.

> --- WHY --- the row is written under EVERY transaction of the batch. the
> account signs the whole batch in one wallet popup, and every
> transaction of that popup produces its own hash. so the account needs a
> row under each of them.

### the answer

`200` with the whole queue, in the same shape the queue route answers
with - the batch, its transactions in `position` order, and the WHO
across the batch.

### the errors

- `401` - `no_api_key` when the header is missing, or
  `unknown_api_key` when the key is not one of ours
- `403` - `not_your_account` when the key is not this account's
- `404` - `no_such_queue` when there is no queue with that id
- `409` - `already_on_the_queue` when the account is already on it
- `500` - `db_unavailable`, or `args_broken` when the arguments of the
  queue could not be read back

> --- WHY --- the queue is checked BEFORE any write. a queue that is not
> there never gets half of an account row written on it.

## THE DELETE

no body. the account to remove is in the path, and the api key in the
header says who is asking.

### what it writes

the account's rows under every transaction of the batch are deleted. a
row that already carries a hash is **history** and is NOT deleted - the
tx happened, and the queue shows who did it.

> --- WHY --- a row that already carries a hash is history. it shows who
> did the transaction and it stays, so the queue still says who sent it
> after the account has stepped off.

### the answer

`200` with the whole queue, in the same shape as the add.

### the errors

- `401` - `no_api_key` or `unknown_api_key`
- `403` - `not_your_account` when the key is not that account's
- `404` - `no_such_queue` when there is no queue with that id, or
  `not_on_the_queue` when the account was not on it
- `500` - `db_unavailable`, or `args_broken` when the arguments of the
  queue could not be read back

## CLIENT

the typed client lives in `middleman/src/`, published as
`@huggies/shit-1170-rex-engine-middleman`:

- `api_shit_1170_tx_queue_accounts_post(base_url, queue_id, body, options)`
- `api_shit_1170_tx_queue_accounts_delete(base_url, queue_id, account_id, options)`

the delete sends NO body - a DELETE with no body is what the route
expects, and a body would say the same thing twice.

=====================
<br/>
copyright 2026 by sleet.near
