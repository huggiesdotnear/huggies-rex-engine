# SHIT-1170 SWAP QUEUE

`POST /api/shit-1170/swap-queue` - queue a SWAP.

`GET /api/shit-1170/swap-queue` - the filterable list of them.

a queued swap is NOT a queued batch of transactions. the tx queue holds
the CALLS, and the agent knows them. a queued swap holds the TRADE - the
token in, the amount in and the token out - and the agent does NOT know
the route. the route is worked out at the moment somebody executes it,
because the pools move every block and a route quoted at queue time is a
route for a pool state that is gone.

## THE REQUEST

```json
{
  "what": "swap 100 USDC for NEAR",
  "when": "when the price is right",
  "why": "you said to move half your usdc",
  "whenAt": 1772666400000,
  "tokenIn": "usdt.tether-token.near",
  "amountIn": "100000000",
  "tokenOut": "near",
  "amountOut": "5000000000000000000000000",
  "dexId": "Rhea",
  "accounts": ["alice.near"]
}
```

`tokenIn`, `amountIn` and `tokenOut` are required. everything else is
optional - an agent that knows the WHAT and not the WHY must still be
able to queue. a made-up WHY is worse than no WHY.

`amountIn` is the RAW unit amount - the token's smallest unit - and not
a human amount. a human amount is only meaningful next to the token it
belongs to: "1.5 NEAR" and "1.5 USDC" are different trades. the raw
number means the same thing whatever the token's decimals are.

`amountOut` and `dexId` are the quote that was taken when the swap was
queued. they are optional, and they are only a FALLBACK: the feed asks
the router for a live quote and shows that.

`accounts` is the WHO - the accounts the agent is queuing this for.
every one of them must be an account the agent holds an api key for, or
the backend answers a 400. that is the NAMING RULE.

the api key travels in the `x-api-key` header, and it names the account
the swap is queued FOR.

## THE ANSWER

`201` with the queued swap, in the same shape every swap route answers
with.

```json
{
  "swapId": "8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11",
  "what": "swap 100 USDC for NEAR",
  "when": "when the price is right",
  "why": "you said to move half your usdc",
  "whenAt": 1772666400000,
  "tokenIn": "usdt.tether-token.near",
  "amountIn": "100000000",
  "tokenOut": "near",
  "amountOut": "5000000000000000000000000",
  "dexId": "Rhea",
  "accounts": [
    {
      "accountId": "alice.near",
      "status": "pending",
      "txHash": null,
      "amountOut": null
    }
  ],
  "createdAt": 1772666400000,
  "updatedAt": 1772666400000
}
```

## THE LIST

`GET /api/shit-1170/swap-queue` answers with
`{ "items": [...], "total": N, "nextCursor": "..." }`.

it is **OPEN** - it asks for NO api key.

the filters are `account_id`, `hide_sent`, `token_in`, `token_out`,
`limit` and `cursor`. the same names and the same rules as the tx
queue's list.

`account_id` is a **COMMA SEPARATED LIST** - one param carries many
accounts, like `alice.near` and `bob.near` in one value - and the
semantics are an OR: "alice's swaps OR bob's swaps". one value still
works. it needs **NO API KEY**.

`hide_sent` is about ONE account - the signed-in reader's OWN account,
or the first account named in the query when the reader is not signed
in. a signed-in reader is never refused, so `?hide_sent=1` with a valid
api key filters by their own account. a reader with NO api key must
name one - `?account_id=alice.near&hide_sent=1`.

`cursor` is the opaque token of the page before. the caller hands the
`nextCursor` from the previous answer straight back. the FIRST page has
no cursor.

**the `total` is the count of the WHOLE match, BEFORE the `limit` and
the `cursor` took their cut.** it does not change as the reader pages.

**the `nextCursor` is the cursor of the NEXT page, or `null` when this
page is the last one.** it is `null` when the page came back short,
because a short page IS the last page.

**a cursor the api cannot read is a `400` with the code `bad_cursor`.**

the list is OPEN. anybody can read it - a queued swap is an open offer,
and hiding it would defeat the point.

> --- WHY --- a cursor and NOT an offset. an offset says "skip the first
> N rows", and the rows are ordered by `created_at DESC` - new swaps
> land at the top of that order all the time. so the first N rows of
> page two are NOT the rows the reader already saw: the reader would
> see a swap twice, or skip one. a cursor says "the rows after this
> one", and that stays true whatever lands above it.
>
> > --- WHY --- a bad cursor is a 400 and NOT the first page. the caller
> > sent something the api does not understand, and answering with the
> > first page would show the reader the same rows twice and hide the
> > fact that their paging was broken.

> --- WHY --- the account filter is the ACCOUNT THE READER NAMED. the
> filter says "the swaps THIS account is on", and the reader picks the
> accounts. the reader's OWN account is not added to the list - the
> reader's own view is the front end's job, and it asks for the account
> it wants.
>
> > --- WHY --- NO KEY IS NEEDED FOR THE ACCOUNT FILTER. the swap list is
> >
> > > an OPEN offer. a reader who is not signed in can already read
> > > every swap and see every account on it - the WHO is right there on
> > > the card. so filtering that PUBLIC list by a name is not a leak,
> > > it is the filter the reader asked for, and the reader does not
> > > have to be signed in to use it.

> --- WHY --- `hide_sent` needs an account. "has this account sent it" is
> a question about ONE account. a swap can be sent by alice and not by
> bob, so there is no single answer about all the accounts at once.
>
> > --- WHY --- the account it is about is the READER'S OWN when they
> >
> > > are signed in, and the FIRST ACCOUNT NAMED in the query when they
> > > are not. a signed-in reader always has an account to be about, so
> > > they are never refused. a reader with NO key has no account of
> > > their own, so they must name one - and the first one they named is
> > > the account the filter is about.

> --- WHY --- the api key is read on the list route ONLY so the reader's
> OWN account is known - the `hide_sent` filter is about the reader's
> own history. a missing or unknown key is NOT an error here: the
> reader gets the list, and the routes that act on a swap are the ones
> that ask for the key.

> --- WHY --- the account rows of the whole page are read in ONE query
> and not one per swap. a page of a hundred swaps is a hundred queries
> that way, and that is the single biggest cost in serving the feed.

## THE ERRORS

the POST route answers:

- `400` - `no_token_in`, `no_token_out`, `same_token`, `no_amount_in` or
  `bad_amount_in` when the swap did not name itself properly, or
  `account_not_named_by_agent` when the agent named an account it holds
  no key for
- `401` - `no_api_key` when the header is missing, or
  `unknown_api_key` when the key is not one of ours
- `500` - `db_unavailable`

the LIST route answers:

- `400` - `hide_sent_without_account` when `hide_sent` came without an
  account, or `bad_cursor` when the cursor could not be read
- `500` - `db_unavailable`

**the LIST has no `401`.** it asks for no key at all - a reader with no
api key still gets the list.

> --- WHY --- a swap of a token for ITSELF is refused. a swap of a token
> for itself is not a trade, and the router has no route for it.

> --- WHY --- a ZERO amount is refused. a swap of nothing is not a trade.

## CLIENT

the typed client lives in `middleman/src/`, published as
`@huggies/shit-1170-rex-engine-middleman`:
`api_shit_1170_swap_queue_post(base_url, body, options)` and
`api_shit_1170_swap_queue_get(base_url, query, options)`.

the CLI bins live in `middleman/bin/shit-1170/`:

```
bun middleman/bin/shit-1170/api_shit_1170_swap_queue_post.ts \
  --api-key shit_1170_abc123... \
  --token-in usdt.tether-token.near \
  --amount-in 100000000 \
  --token-out near \
  --account alice.near
```

=====================
<br/>
copyright 2026 by sleet.near
