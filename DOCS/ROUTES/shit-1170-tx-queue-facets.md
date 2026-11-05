# SHIT-1170 TX QUEUE FACETS

`GET /api/shit-1170/tx-queue/facets` - the CONTRACTS and the ACCOUNTS
that have queued work.

the feed's filter bar offers a button for each contract and each
account, and it cannot show a button for something that is not there.
this route is what the bar asks once when the page opens, and it builds
its buttons from the answer.

## THE QUERY

one param:

- `limit` - how many contracts and how many accounts. default 40, and
  clamped to 500

there is one limit and not two, because one number applies to both
lists and there is no second word to read.

## THE ANSWER

`200`:

```json
{
  "contracts": [
    { "contractId": "ref.finance.near", "count": 42 },
    { "contractId": "wrap.near", "count": 4 }
  ],
  "accounts": [{ "accountId": "alice.near", "count": 7 }]
}
```

both lists are ordered by count, biggest first, and then by the id, so
two entries with the same count always come back in the same order.

the `count` of a contract is how many queued **transactions** call it.
the `count` of an account is how many queued **batches** it is on.

> --- WHY --- the contract counts the CALLS and not the batches. the
> contract is a property of a transaction, and a batch of three calls
> can hit three different contracts. counting the calls says how much
> work is aimed at a contract, and that is what the reader is choosing
> between.
>
> > --- WHY --- the account counts the BATCHES and not the account rows.
> > an account is on a batch once, and it has one account row per
> > transaction of that batch. three rows for one batch are one account
> > on one batch, and counting the rows would make a batch of three
> > calls look busier than three batches of one call.

## THE ERRORS

- `500` - `db_unavailable`

the route is **OPEN**. no api key is needed.

> --- WHY --- the route is open. the queue list is open, and the facets
> are a summary of the same thing. a reader who can read the feed can
> read what is in it.
>
> > --- WHY --- there is a limit and not a count of everything. a db with
> > ten thousand queued accounts would make a bar of ten thousand
> > buttons, and a reader cannot use that. the limit keeps the bar
> > readable, and the busy ones come first.

> --- WHY --- the counts are over the WHOLE queue and not over the
> reader's view. the bar says what is out there to filter, and a reader
> who cannot see a queue cannot filter for it either.

## CLIENT

the typed client lives in `middleman/src/`, published as
`@huggies/shit-1170-rex-engine-middleman`:
`api_shit_1170_tx_queue_facets_get(base_url, query, options)`.

=====================
<br/>
copyright 2026 by sleet.near
