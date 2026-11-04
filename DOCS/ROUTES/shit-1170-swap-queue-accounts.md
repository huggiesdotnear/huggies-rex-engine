# SHIT-1170 SWAP QUEUE ACCOUNTS

`POST /api/shit-1170/swap-queue/{swap_id}/accounts` - add YOUR OWN
account to a queued swap.

`DELETE /api/shit-1170/swap-queue/{swap_id}/accounts/{account_id}` -
remove YOUR OWN account from a queued swap.

the rule is the same as the tx queue's: the api key in the header must
belong to the account. you can only ever add or remove YOURSELF.

## THE REQUEST

```json
{ "accountId": "alice.near" }
```

the account is in the body and the key is in the header, and the route
answers a 403 when the two do not match. so the body says which account
and the key says who is asking.

## THE ANSWER

`200` with the whole swap, in the same shape the swap route answers
with.

## WHAT IT WRITES

one row on the swap for the account, with the status `pending`.

> --- WHY --- A QUEUED SWAP NEEDS ONLY ONE ROW PER ACCOUNT. a queued
> swap is ONE swap, so there is no batch of transactions to write a row
> under. one row says "this account wants this swap".

> --- WHY --- the delete only takes the row that carries NO hash. a row
> that carries a hash is HISTORY - the swap happened, and the swap shows
> who did it.

## THE ERRORS

- `401` - `no_api_key` when the header is missing, or
  `unknown_api_key` when the key is not one of ours
- `403` - `not_your_account` when the key is not that account's
- `404` - `no_such_swap` when there is no swap with that id, or
  `not_on_the_queue` when the account was not on it
- `409` - `already_on_the_queue` when the account is already on the swap
- `500` - `db_unavailable`

## CLIENT

`api_shit_1170_swap_queue_accounts_post(base_url, swap_id, body, options)`
and
`api_shit_1170_swap_queue_accounts_delete(base_url, swap_id, account_id, options)`.

=====================
<br/>
copyright 2026 by sleet.near
