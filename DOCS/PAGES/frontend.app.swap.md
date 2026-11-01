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

the output input is read-only: it shows what the chosen route pays.

## the routes

the aggregator answers with one route per dex that can serve the pair,
best first. the best route is marked, and the reader can pick another.
the route the reader picked is the one the output input shows.

the routes are fetched AND subscribed: the fetch fills the screen at
once, and the socket keeps the amount out live as the pools move. the
socket is bound to one query, so it is closed and reopened whenever the
pair or the amount changes.

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
