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

`GET /api/shit-1170/swap-queue` answers with `{ "items": [...], "total": N }`.

the filters are `account_id`, `hide_sent`, `token_in`, `token_out`,
`limit` and `offset`. the same names and the same rules as the tx
queue's list.

the list is OPEN. anybody can read it - a queued swap is an open offer,
and hiding it would defeat the point.

> --- WHY --- the account filter is always the CALLER's own account. the
> filter says "the swaps THIS account is on", and a reader who is not
> signed in has no account. asking for somebody else's swaps by name is
> not a thing a stranger can do.

> --- WHY --- `hide_sent` needs an account. "has this account sent it" is
> a question about ONE account. a swap can be sent by alice and not by
> bob, so there is no single answer about all the accounts at once.

## THE ERRORS

- `400` - `no_token_in`, `no_token_out`, `same_token`, `no_amount_in` or
  `bad_amount_in` when the swap did not name itself properly, or
  `account_not_named_by_agent` when the agent named an account it holds
  no key for
- `401` - `no_api_key` when the header is missing, or
  `unknown_api_key` when the key is not one of ours
- `500` - `db_unavailable`

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
