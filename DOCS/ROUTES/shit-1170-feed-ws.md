# SHIT-1170 FEED WS

`GET /api/shit-1170/feed/ws` - the live feed. a websocket upgrade.

the feed page does not have to poll. the server pushes every new batch
and every new swap to every connected client the moment it is queued.

## THE SOCKET

the client opens the socket and the server sends ONE json text message
per event. there is nothing else - no ping with a payload, no ack, no
error envelope. a client that connects and receives nothing is simply a
client with no new work.

a queued batch:

```json
{
  "type": "queue",
  "queue": {
    "queueId": "…",
    "what": "swap 100 USDC for NEAR",
    "when": "when the price is right",
    "why": "you said to move half your usdc",
    "whenAt": 1772666400000,
    "transactions": [],
    "accounts": [],
    "createdAt": 1772666400000,
    "updatedAt": 1772666400000
  }
}
```

a queued swap:

```json
{
  "type": "swap",
  "swap": {
    "swapId": "…",
    "what": "sell usdc",
    "when": null,
    "why": null,
    "whenAt": null,
    "tokenIn": "usdt.tether-token.near",
    "amountIn": "100000000",
    "tokenOut": "wrap.near",
    "amountOut": null,
    "dexId": null,
    "accounts": [],
    "createdAt": 1772666400000,
    "updatedAt": 1772666400000
  }
}
```

the `queue` payload is the EXACT shape the tx-queue list route answers
with, and the `swap` payload is the EXACT shape the swap-queue list
route answers with. a client can drop a live event straight into the
same list it fills from the api, without touching it.

> --- WHY --- the payload is the item and not a diff. the truth about a
> queued batch lives in three db rows - the batch, its transactions and
> its account rows - and the wire shape of that is already written down
> once, in the route that answers with it. a live event that carried
> anything else would be a second shape for the same thing, and one of
> the two would eventually be wrong.

## WHAT IS PUSHED

- a batch is queued - `POST /api/shit-1170/tx-queue`
- a swap is queued - `POST /api/shit-1170/swap-queue`
- an account joins a batch - `POST /api/shit-1170/tx-queue/{queue_id}/accounts`
- an account joins a swap - `POST /api/shit-1170/swap-queue/{swap_id}/accounts`
- a batch was sent - `POST /api/shit-1170/tx-queue/{queue_id}/sent`
- a swap was sent - `POST /api/shit-1170/swap-queue/{swap_id}/sent`

every one of them pushes the SAME item the route answers with, so the
client's live post is byte-for-byte what a refetch would give it.

## THE SOCKET IS OPEN

no api key is needed.

> --- WHY --- the queue list is open, and the socket carries the same
> items in the same shape. a socket that asked for a key would be a
> socket the feed page could not open before it had signed in.

## WHEN THE CLIENT IS SLOW

a client that cannot keep up with the events misses them. the server
logs it and the connection stays open - the truth is still in the db, so
the client can refetch the list.

> --- WHY --- a slow client is not a dead client. the usual slow client
> is a phone on a bad connection, and dropping it would turn a reader
> who can still act into a reader who has to reload.

## THE PING

the server pings every thirty seconds. a ping is a websocket CONTROL
frame, so the client's message handler never sees it - only the events
above.

## CLIENT

the typed client lives in `middleman/src/`, published as
`@huggies/shit-1170-rex-engine-middleman`:
`api_shit_1170_feed_ws(base_url, on_event, on_error)`. it returns a
handle with one method on it, `close()`.

the base url is turned into a socket url - `http` becomes `ws`, `https`
becomes `wss` - and the route is appended. the socket is OPEN, so
there is no api key.

```ts
const handle = api_shit_1170_feed_ws(
  window.location.origin,
  (event) => {
    if (event.type === "queue") console.log(event.queue.queueId);
    if (event.type === "swap") console.log(event.swap.swapId);
  },
  (message) => console.error(message),
);

handle.close();
```

> --- WHY --- the client RECONNECTS on its own. a socket dies on a
> phone all the time - a tunnel, a sleep, a network change - and a feed
> page that does not reconnect is a feed page that silently goes stale.
> the wait starts at one second, doubles every failure, and is capped
> at fifteen.

> --- WHY --- `close()` STOPS the reconnects. the close is the caller's
> word that the feed is not wanted, and a handle that reconnected after
> a close would open a socket nobody is reading.

the CLI bin lives in `middleman/bin/shit-1170/`:

```
bun middleman/bin/shit-1170/api_shit_1170_feed_ws.ts --base-url http://127.0.0.1:54733
```

it listens and prints until it is stopped with ctrl+c.

=====================
<br/>
copyright 2026 by sleet.near
