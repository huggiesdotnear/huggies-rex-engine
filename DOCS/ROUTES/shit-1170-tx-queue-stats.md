# SHIT-1170 TX QUEUE STATS

`GET /api/shit-1170/tx-queue/stats/contracts` - how many queued
transactions hit each contract.

`GET /api/shit-1170/tx-queue/stats/methods` - how many queued
transactions called each method.

two `GROUP BY` reads over the queued transactions. they are cheap, and
they are what the ui will read later.

## THE CONTRACTS ANSWER

`200`:

```json
{
  "items": [
    { "contractId": "ref.finance.near", "count": 12 },
    { "contractId": "wrap.near", "count": 4 }
  ]
}
```

ordered by count, biggest first, and then by the contract id, so two
contracts with the same count always come back in the same order.

## THE METHODS ANSWER

`200`:

```json
{
  "items": [
    { "method": "ft_swap", "contractId": "ref.finance.near", "count": 9 }
  ]
}
```

ordered by count, biggest first, then by the method, then by the
contract id.

> --- WHY --- the methods carry the contract id. `ft_swap` on two
> different contracts is two different transactions. a method count
> without the contract would blend them, and "the most common methods"
> would be a misleading number. so the group is by BOTH the method and
> the contract.

## THE LIMIT

a `limit` query param, default 20, clamped to 500.

a limit is CLAMPED and not refused: a caller who asks for a thousand is
not a caller to be turned away - they want a big page, and a big page is
fine. and a NEGATIVE limit means "no limit" in sqlite, so it has to be
clamped too.

## THE ERRORS

- `401` - `no_api_key` when the header is missing, or
  `unknown_api_key` when the key is not one of ours
- `500` - `db_unavailable`

## WHY THESE TWO EXIST NOW

the ui does not read them yet. they are here because they are the whole
reason `contract_id` and `method` have their own COLUMNS and not one
json blob.

a `GROUP BY` on an indexed column is a cheap read, and a `GROUP BY`
inside a json blob is a scan of every row, every time.

> --- WHY --- the group is over the TRANSACTIONS and not over the account
> rows. a queued tx exists the moment it is queued. nobody has to have
> sent it for it to be a queued tx.

## CLIENT

the typed client lives in `middleman/src/`, published as
`@huggies/shit-1170-rex-engine-middleman`:

- `api_shit_1170_tx_queue_stats_contracts_get(base_url, query, options)`
- `api_shit_1170_tx_queue_stats_methods_get(base_url, query, options)`

=====================
<br/>
copyright 2026 by sleet.near
