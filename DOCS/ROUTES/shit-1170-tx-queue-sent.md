# SHIT-1170 TX QUEUE SENT

`POST /api/shit-1170/tx-queue/{queue_id}/sent` - record that the
transactions were sent.

the wallet signed the whole batch in one popup, so the app reports every
hash in ONE call.

## THE REQUEST

```json
{
  "txHashes": [
    {
      "txId": "1a2b3c4d-0000-0000-0000-000000000001",
      "txHash": "9hN3lq...",
      "status": "succeeded"
    },
    {
      "txId": "1a2b3c4d-0000-0000-0000-000000000002",
      "txHash": "AbCdEf...",
      "status": "failed"
    }
  ]
}
```

`txId` is required on each entry - it says which transaction of the
batch the hash belongs to.

`txHash` is required - a hash without a transaction says nothing.

`status` is optional. it is `succeeded` or `failed`. when it is left out
the status is `sent`, which means "it went out and nobody knows how it
went yet".

the account is NOT in the body. it comes from the header - the key IS
the account.

## THE ANSWER

`200` with the whole queue, in the same shape the queue route answers
with - the batch, its transactions in `position` order, and the WHO
across the batch.

## WHAT IT WRITES

for each entry:

- the account's row under that `tx_id` is CREATED if it is not there,
  and its `status` and `tx_hash` are written.

a new account that was never named signs, and a row is created for it,
so it appears in the queue's WHO list too. the WHO list grows as people
send.

> --- WHY --- the account row is CREATED and not updated. an account
> signing a queue it was NOT named on has no row yet, and signing it
> JOINS the queue - it found the queue, it chose it, and its send is
> recorded. an update would find nothing and the send would be lost.

> --- WHY --- the account comes from the HEADER and the body does not
> repeat it. the key IS the account. a body that named the account could
> name somebody else's, and then the check would be a suggestion.

> --- WHY --- a `txId` must belong to THIS queue. the body says which
> transaction of the batch the hash belongs to, and a hash on somebody
> else's transaction would put a wrong answer on their row.

> --- WHY --- a MISSING status means `sent`. the outcome is not known at
> the moment the hash is written - the frontend reads it off the chain
> later and reports it back. so `sent` is a real state.

## THE ERRORS

- `400` - `no_tx_hashes` when the body carried no hashes, `no_tx_id` or
  `no_tx_hash` when an entry was missing one,
  `tx_not_on_this_queue` when a `txId` belongs to another queue, or
  `bad_status` when a status was something other than `succeeded` or
  `failed`
- `401` - `no_api_key` when the header is missing, or
  `unknown_api_key` when the key is not one of ours
- `404` - `no_such_queue` when there is no queue with that id
- `500` - `db_unavailable`, or `args_broken` when the arguments of the
  queue could not be read back

> --- WHY --- every entry is checked BEFORE anything is written. a body
> that is going to be refused never leaves half of itself in the db.

## THE BACKEND DOES NOT CHECK THE CHAIN

the route stores what it is told. it does not ask the chain whether the
transaction succeeded. the frontend reads the outcome from fastnear, as
the swap page already does, and reports it back.

## CLIENT

the typed client lives in `middleman/src/`, published as
`@huggies/shit-1170-rex-engine-middleman`:
`api_shit_1170_tx_queue_sent_post(base_url, queue_id, body, options)`.

=====================
<br/>
copyright 2026 by sleet.near
