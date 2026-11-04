# SHIT-1170 SWAP QUEUE SENT

`POST /api/shit-1170/swap-queue/{swap_id}/sent` - record that the swap
was sent.

THIS is the route the swap page calls after it executes a queued swap.
it is the answer to "how do we update the status for a queued swap when
it is done from the swap page?" - the same way the tx queue's sent route
records the transactions of a queued batch.

a queued swap is ONE swap, so there is ONE hash and not a list. the tx
queue carries a list because it queues a BATCH of transactions.

## THE REQUEST

```json
{
  "txHash": "9hN3lq...",
  "status": "succeeded",
  "amountOut": "4999000000000000000000000"
}
```

`txHash` is required - a hash without a transaction says nothing.

`status` is optional. it is `succeeded` or `failed`. when it is left out
the status is `sent`, which means "it went out and nobody knows how it
went yet".

`amountOut` is optional. it is the amount that came out of THAT send, in
the output token's smallest unit. it is null when nobody knows it.

the account is NOT in the body. it comes from the header - the key IS
the account.

## THE ANSWER

`200` with the whole swap, in the same shape the swap route answers
with.

## WHAT IT WRITES

the account's row on the swap is CREATED if it is not there, and its
`status`, its `tx_hash` and its `amount_out` are written.

a new account that was never named executes the swap, and a row is
created for it, so it appears in the swap's WHO list too. the WHO list
grows as people execute.

> --- WHY --- the account row is CREATED and not updated. an account
> executing a swap it was NOT named on has no row yet, and executing it
> JOINS the swap - it found the swap, it chose it, and its send is
> recorded. an update would find nothing and the send would be lost.

> --- WHY --- `amountOut` goes on the ACCOUNT ROW and not on the swap.
> the amount that came out belongs to THAT send. two accounts executing
> the same queued swap get two different amounts out, because the pools
> moved between the two sends.

> --- WHY --- a MISSING status means `sent`. the outcome is not known at
> the moment the hash is written - the frontend reads it off the chain
> later and reports it back. so `sent` is a real state.

## THE ERRORS

- `400` - `no_tx_hash` when the body carried no hash, `bad_status` when

> the status was something other than `succeeded` or `failed`, or
> `bad_amount_out` when the amount out was not a whole number

- `401` - `no_api_key` when the header is missing, or

> `unknown_api_key` when the key is not one of ours

- `404` - `no_such_swap` when there is no swap with that id
- `500` - `db_unavailable`

## THE BACKEND DOES NOT CHECK THE CHAIN

the route stores what it is told. it does not ask the chain whether the
swap succeeded. the swap page reads the outcome off the chain and
reports it back.

## CLIENT

`api_shit_1170_swap_queue_sent_post(base_url, swap_id, body, options)`.

=====================
<br/>
copyright 2026 by sleet.near
