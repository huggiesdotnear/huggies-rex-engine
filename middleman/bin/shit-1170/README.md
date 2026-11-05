# bin/shit-1170

cli bins for our own backend, called through `middleman`.
one bin per route of ours, so a new route gets a new bin.

all commands are run from the project root.

every bin takes `--base-url <url>` to point at a backend other than the
default one (`http://127.0.0.1:54733`).

## the api key

the api key is the bearer token the user hands to an agent. it travels
in the `x-api-key` header, and the legacy `x-session-token` header is
sent alongside it during the beta.

every bin that needs one takes `--api-key <key>`.

## api_shit_1170_ping_get

GET /api/shit-1170/ping — liveness check. answers
`{ "ok": true, "app": "shit-1170" }`.

```sh
# defaults to http://127.0.0.1:54733
bun middleman/bin/shit-1170/api_shit_1170_ping_get.ts

# point at a different backend (staging / docker host / etc.)
bun middleman/bin/shit-1170/api_shit_1170_ping_get.ts --base-url http://my-host:54733
```

## api_shit_1170_api_keys_post

POST /api/shit-1170/api-keys — sign in and get an api key. the signed
messages come from a json file, so a real signature can be posted
without a wallet in the loop. the file holds the accounts array, either
as the array itself or as the whole request body.

```sh
bun middleman/bin/shit-1170/api_shit_1170_api_keys_post.ts --accounts ./accounts.json
```

## api_shit_1170_api_key_me_get

GET /api/shit-1170/api-key/me — which account the api key belongs to.

```sh
bun middleman/bin/shit-1170/api_shit_1170_api_key_me_get.ts --api-key shit_1170_abc123...
```

## api_shit_1170_api_key_rotate_post

POST /api/shit-1170/api-key/rotate — give an account a NEW api key. the
old key stops working at once. the signed message comes from a json
file, the same way the sign-in bin takes it.

```sh
bun middleman/bin/shit-1170/api_shit_1170_api_key_rotate_post.ts --accounts ./accounts.json
```

## api_shit_1170_feed_ws

GET /api/shit-1170/feed/ws — the LIVE feed, a websocket. the server
pushes every newly queued batch and every newly queued swap, so the bin
prints them as they land.

the bin LISTENS until it is stopped with ctrl+c. it reconnects on its
own when the socket drops, so a run that goes quiet for a while is a
backend that is down, not a bin that gave up.

the socket is OPEN: there is no `--api-key`.

```sh
bun middleman/bin/shit-1170/api_shit_1170_feed_ws.ts
bun middleman/bin/shit-1170/api_shit_1170_feed_ws.ts --base-url http://my-host:54733
```

## the tx queue

a `queue_id` is a BATCH of transactions, not one transaction. the agent
queues a swap that needs three calls, they go in together, and the user
signs them as one batch in one wallet popup.

## api_shit_1170_tx_queue_post

POST /api/shit-1170/tx-queue — queue a batch of transactions.

one flag per transaction, and the flag order IS the transaction order:
the nth `--contract-id`, the nth `--method` and the nth `--args` are
the nth transaction. `--gas` and `--deposit` are optional per call.

`--account` names the WHO — the accounts the batch is for. each one
must be an account the api key belongs to.

```sh
# queue ONE transaction
bun middleman/bin/shit-1170/api_shit_1170_tx_queue_post.ts \
  --api-key shit_1170_abc123... \
  --contract-id ref.finance.near \
  --method ft_swap \
  --args '{"receiver_id":"alice.near"}' \
  --what "swap 100 USDC for NEAR" \
  --why "you asked for it" \
  --account alice.near

# queue a BATCH of two, in order, in one wallet popup
bun middleman/bin/shit-1170/api_shit_1170_tx_queue_post.ts \
  --api-key shit_1170_abc123... \
  --contract-id ref.finance.near \
  --method ft_swap \
  --args '{"receiver_id":"alice.near"}' \
  --gas 30000000000000 \
  --deposit 1 \
  --contract-id ref.finance.near \
  --method ft_resolve_transfer \
  --args '{"receiver_id":"alice.near"}' \
  --when "when the price is right" \
  --when-at 1772666400000
```

## api_shit_1170_tx_queue_get

GET /api/shit-1170/tx-queue — the queue list, filterable.

- `--account-id` — only the queues this account is on
- `--hide-sent` — with the account, drop the ones it has already sent
- `--contract-id` — only the queues holding a tx for this contract
- `--method` — only the queues holding a tx for this method
- `--limit` — how many, default 50
- `--offset` — where to start, default 0

`--hide-sent` stands alone, it takes no value. it needs `--account-id`
— it is a filter on ONE account's view.

```sh
bun middleman/bin/shit-1170/api_shit_1170_tx_queue_get.ts --api-key shit_1170_abc123...
bun middleman/bin/shit-1170/api_shit_1170_tx_queue_get.ts \
  --api-key shit_1170_abc123... \
  --account-id alice.near \
  --hide-sent \
  --limit 20
```

## api_shit_1170_tx_queue_one_get

GET /api/shit-1170/tx-queue/{queue_id} — one queued batch, with its
transactions and its accounts.

```sh
bun middleman/bin/shit-1170/api_shit_1170_tx_queue_one_get.ts \
  --api-key shit_1170_abc123... \
  --queue-id 8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11
```

## api_shit_1170_tx_queue_accounts_post

POST /api/shit-1170/tx-queue/{queue_id}/accounts — add YOUR OWN account
to a queued batch. the api key must belong to that account.

```sh
bun middleman/bin/shit-1170/api_shit_1170_tx_queue_accounts_post.ts \
  --api-key shit_1170_abc123... \
  --queue-id 8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11 \
  --account-id alice.near
```

## api_shit_1170_tx_queue_accounts_delete

DELETE /api/shit-1170/tx-queue/{queue_id}/accounts/{account_id} —
remove YOUR OWN account from a queued batch. a row that already carries
a hash is history and is not deleted.

```sh
bun middleman/bin/shit-1170/api_shit_1170_tx_queue_accounts_delete.ts \
  --api-key shit_1170_abc123... \
  --queue-id 8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11 \
  --account-id alice.near
```

## api_shit_1170_tx_queue_sent_post

POST /api/shit-1170/tx-queue/{queue_id}/sent — record that the
transactions were sent.

ONE call for the whole batch — the wallet sent every transaction in one
popup, so the app reports every hash in one call. the flags repeat, and
the nth `--tx-id`, the nth `--tx-hash` and the nth `--status` are the
nth entry.

`--status` is optional: without it the status is `sent`, which means
"it went out and nobody knows how it went yet".

```sh
bun middleman/bin/shit-1170/api_shit_1170_tx_queue_sent_post.ts \
  --api-key shit_1170_abc123... \
  --queue-id 8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11 \
  --tx-id 1a2b3c4d-0000-0000-0000-000000000001 \
  --tx-hash 9hN3lq... \
  --status succeeded \
  --tx-id 1a2b3c4d-0000-0000-0000-000000000002 \
  --tx-hash AbCdEf... \
  --status failed
```

## api_shit_1170_tx_queue_stats_contracts_get

GET /api/shit-1170/tx-queue/stats/contracts — how many queued
transactions hit each contract, biggest first.

```sh
bun middleman/bin/shit-1170/api_shit_1170_tx_queue_stats_contracts_get.ts \
  --api-key shit_1170_abc123... \
  --limit 20
```

## api_shit_1170_tx_queue_stats_methods_get

GET /api/shit-1170/tx-queue/stats/methods — how many queued
transactions call each method, biggest first. the contract rides along,
because `ft_swap` on two contracts is two different transactions.

```sh
bun middleman/bin/shit-1170/api_shit_1170_tx_queue_stats_methods_get.ts \
  --api-key shit_1170_abc123... \
  --limit 20
```

## api_trezu_treasuries_get

GET /api/trezu/user/treasuries — the treasuries (sputnik daos) an
account belongs to. the account id is required and is trimmed.
`--include-hidden` stands alone, it takes no value.

```sh
bun middleman/bin/shit-1170/api_trezu_treasuries_get.ts sleet.near
bun middleman/bin/shit-1170/api_trezu_treasuries_get.ts sleet.near --include-hidden
bun middleman/bin/shit-1170/api_trezu_treasuries_get.ts sleet.near --base-url http://my-host:54733
```

## the swap queue

a `swap_id` is a SWAP, not a batch of transactions. the agent does not
know the route — it names the token in, the amount in and the token out,
and the route is worked out when the swap is executed.

`--amount-in` is the RAW unit amount — the token's smallest unit — and
not a human amount. a human amount only means something next to the
token it belongs to.

## api_shit_1170_swap_queue_post

POST /api/shit-1170/swap-queue — queue a swap.

`--account` names the WHO — the accounts the swap is for. each one must
be an account the api key belongs to.

```sh
bun middleman/bin/shit-1170/api_shit_1170_swap_queue_post.ts \
  --api-key shit_1170_abc123... \
  --token-in usdt.tether-token.near \
  --amount-in 100000000 \
  --token-out near \
  --what "swap 100 USDC for NEAR" \
  --why "you asked for it" \
  --account alice.near
```

## api_shit_1170_swap_queue_get

GET /api/shit-1170/swap-queue — the swap list, filterable.

- `--account-id` — only the swaps this account is on
- `--hide-sent` — with the account, drop the ones it has already sent
- `--token-in` — only the swaps that sell this token
- `--token-out` — only the swaps that buy this token
- `--limit` — how many, default 50
- `--offset` — where to start, default 0

`--hide-sent` stands alone, it takes no value. it needs `--account-id`
— it is a filter on ONE account's view.

```sh
bun middleman/bin/shit-1170/api_shit_1170_swap_queue_get.ts --api-key shit_1170_abc123...
bun middleman/bin/shit-1170/api_shit_1170_swap_queue_get.ts \
  --api-key shit_1170_abc123... \
  --account-id alice.near \
  --hide-sent \
  --limit 20
```

## api_shit_1170_swap_queue_one_get

GET /api/shit-1170/swap-queue/{swap_id} — one queued swap, with its
accounts.

```sh
bun middleman/bin/shit-1170/api_shit_1170_swap_queue_one_get.ts \
  --api-key shit_1170_abc123... \
  --swap-id 8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11
```

## api_shit_1170_swap_queue_accounts_post

POST /api/shit-1170/swap-queue/{swap_id}/accounts — add YOUR OWN
account to a queued swap. the api key must belong to that account.

```sh
bun middleman/bin/shit-1170/api_shit_1170_swap_queue_accounts_post.ts \
  --api-key shit_1170_abc123... \
  --swap-id 8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11 \
  --account-id alice.near
```

## api_shit_1170_swap_queue_accounts_delete

DELETE /api/shit-1170/swap-queue/{swap_id}/accounts/{account_id} —
remove YOUR OWN account from a queued swap. a row that already carries a
hash is history and is not deleted.

```sh
bun middleman/bin/shit-1170/api_shit_1170_swap_queue_accounts_delete.ts \
  --api-key shit_1170_abc123... \
  --swap-id 8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11 \
  --account-id alice.near
```

## api_shit_1170_swap_queue_sent_post

POST /api/shit-1170/swap-queue/{swap_id}/sent — record that the swap
was sent. THIS is the route the swap page calls after it executes a
queued swap.

a queued swap is ONE swap, so there is ONE hash and not a list.

`--status` is optional: without it the status is `sent`, which means
"it went out and nobody knows how it went yet". `--amount-out` is the
amount that came out, in the output token's smallest unit.

```sh
bun middleman/bin/shit-1170/api_shit_1170_swap_queue_sent_post.ts \
  --api-key shit_1170_abc123... \
  --swap-id 8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11 \
  --tx-hash 9hN3lq... \
  --status succeeded \
  --amount-out 4999000000000000000000000
```

========================================
<br/>
copyright 2026 by sleet.near
