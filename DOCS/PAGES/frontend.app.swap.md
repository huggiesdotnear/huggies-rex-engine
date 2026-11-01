# frontend/app/swap.html

SWAP

the swap page trades one token for another over the intear
dex-aggregator. it is the app's first transaction page: the reader
signs a swap here, and the page tells them what came of it.

## the shape of the page

three components, stacked in the page column:

- `HUGGIES_COMPONENT_SWAP_FORM` — the two token cards, the two amount
  inputs, the switch direction bar between them and the swap button
- `HUGGIES_COMPONENT_SWAP_ROUTES` — one card per route the aggregator
  found, best first
- `HUGGIES_COMPONENT_SWAP_TOKEN_PICKER` — the popup that opens over
  the form when a token card is clicked

and the toast layer, which floats over the page and says what the swap
came to.

## the two tokens

the pair comes from the url — `?in=` and `?out=` — so a swap is a link
worth keeping. the page opens on NEAR for $SHIT.

a token card is a button: the icon, the symbol and the balance of that
token. clicking it opens the picker, which searches the token list and
writes the chosen token back to the store.

native NEAR is in the picker even though the intear api has no `near`
entry — it comes back in the api's `missing` list — so the picker adds
it itself, at the top of the list and in the search results.

## the amounts

the two inputs are for HUMANS. the reader types `1`, and the app shows
`1.000000000000000000000000` (the unit amount the chain sees) and the
usd value underneath it. the router quotes in the smallest unit, so the
conversion happens in the store that owns the quoting.

BOTH inputs can be typed into. the reader fixes ONE side of the swap
and the router answers the other:

- typing in the top box fixes the amount IN — the router is asked
  "what do I get for this much?"
- typing in the bottom box fixes the amount OUT — the router is asked
  "what does this much cost?"

the side the reader fixed is the side the router is asked about, and
the other box shows the answer. the api serves both questions:
`AMOUNT_IN` and `AMOUNT_OUT`.

## WHAT THE API ANSWERS

the router answers ONE direction per question, and this is the whole
shape of the api:

```
?amount_in=X   ->  { estimated_amount: { amount_out }, worst_case_amount: { amount_out } }
?amount_out=X  ->  { estimated_amount: { amount_in },  worst_case_amount: { amount_in } }
```

an amount OUT question is answered with the amount IN and NOTHING
else. the requested output is not in the answer at all — it only lives
inside the base64 transaction args, and the router GUARANTEES it by
buying enough to cover the slippage (its `constraint` is larger than
the quoted cost, because it over-buys to be safe).

so the output-specified screen shows two numbers and they are not the
same kind of number:

- the OUT box holds the reader's own number — the guaranteed output
- the IN box holds the cost the router quoted
- the route card shows the cost per dex, and names the guaranteed
  output on a `GET` line

this is why the input-specified screen and the output-specified screen
do not look alike: the api only has ONE figure to give in each
direction, and the page shows the figure it has.

## the switch direction

the bar between the two sides swaps the pair AND carries the amount
over. the reader said "sell 5 A and get 10 B"; after the switch the
same trade reads "sell 10 B and get 5 A", so the two amounts trade
places with the two tokens.

the swap is ONE action in the store, not two writes. writing the two
tokens one after the other reads the state the first write already
changed, which puts the same token on both sides.

picking a token in the picker that is already on the OTHER side swaps
the pair too. the page never shows the same token on both sides — a
swap of a token for itself is not a trade, and the router has no route
for it.

## the routes

the aggregator answers with one route per dex that can serve the pair,
best first. the best route is marked, and the reader can pick another.
the route the reader picked is the one the output input shows.

the route cards read the SIDE the reader is fixing. when they fixed the
input, the card shows what the swap PAYS; when they fixed the output,
the card shows what it COSTS. the router answers an amount out
question with the amount IN, so a card that always read the amount out
would show "0.00" for every route.

when the output is fixed, the card also names the GUARANTEED output on
a `GET` line — the router does not send it, so the page uses the
reader's own number, which is what the router guarantees. every route
pays the same output, so the cost is what the cards compare.

the routes are fetched AND subscribed: the fetch fills the screen at
once, and the socket keeps the amount out live as the pools move. the
socket is bound to one query, so it is closed and reopened whenever the
pair or the amount changes.

erasing the amount closes the socket and drops the routes. the socket
answers ONE query, so a socket left open after the amount is erased
would push the old answer back over the cleared screen.

## the swap

the reader signs with their wallet, and the route's transactions go to
the wallet in ONE popup. the app then asks the aggregator what
actually happened on chain before it pays the referral fee legs: the
transaction carrying an `ft_transfer_call` swap succeeds even when the
dex refunds it, so a status check alone would report a failed swap as
a success.

the outcome comes back as a toast — success, failure, or the third
case where the swap may well have gone through but the check could not
tell — and a toast with a transaction links to the transaction page.

## WHAT THE PAGE REQUESTS

see [`requests.csv`](./requests.csv) for the swap page's rows.

=====================
<br/>
copyright 2026 by sleet.near
