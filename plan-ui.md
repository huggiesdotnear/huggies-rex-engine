# PLAN — THE FEED AND THE QUEUE UI

> status: **awaiting review**. nothing below has been built yet.
> the backend plan is [`plan.md`](./plan.md). this file is the ui half.

the ui for the tx queue: a **feed page** that reads like a social feed,
and a **queue page** that says everything about one queued batch.

> --- HOW --- the backend must exist first. every route this ui calls is
> in [`plan.md`](./plan.md). the feed page and the queue page are built
> after the backend lands, so there is always something to talk to.
>
> the api key rename rides along: the middleman's header becomes
> `x-api-key` and the frontend's `session.ts` becomes `api_key.ts`.

---

## 0. THE TWO PAGES

| page | file | url | what it is |
|---|---|---|---|
| the **FEED** | `frontend/app/index.html` | `/app/index.html` | the social feed of queued txs |
| the **QUEUE** | `frontend/app/queue.html` | `/app/queue.html?queue=<queue_id>` | everything about one batch |

**the feed page is already there** — `frontend/app/index.html` is the
app's front door and it currently says "COMING SOON!". it becomes the
feed. its import file is already `import-feed.ts`, and it already loads
the right script tag. so the feed page needs **no new html file** — only
the body of the page changes.

**the queue page is new.** one html file, one import file, one css
entry, and several components.

### the pages in the docs

```
DOCS/PAGES/frontend.app.index.md       (changed — it is the feed now)
DOCS/PAGES/frontend.app.queue.md       (new)
DOCS/PAGES/components.csv              (changed)
DOCS/PAGES/requests.csv                (changed)
DOCS/PAGES/README.md                   (changed — the queue page is listed)
```

---

## 1. THE FEED PAGE — A SOCIAL FEED

### what a feed item is

each queued batch is **one post**. a post carries:

- **the what / when / why** — the agent's words, the headline of the post
- **the transactions** — what will be sent, in order
- **the WHO** — who it is for, and who has sent it
- **the actions** — the buttons

the post is the social part: the reader sees what somebody's agent wants
them to do, and they act on it.

### the filter and sort bar, at the top

a bar across the top of the feed, above the posts. it holds:

| control | what it does |
|---|---|
| **ACCOUNT** | filter to the queues this account is on. defaults to the signed-in account |
| **HIDE SENT** | hide the queues this account has already sent |
| **SORT** | newest first / oldest first / most accounts |

**the filter lives in the url**, so a filtered feed is a link somebody
can paste:

```
/app/index.html?account=alice.near&hide_sent=1&sort=newest
```

**why the url holds it.** the app's rule is that the url says what the
page is showing — the token page, the account page and the swap page all
do it. a feed that cannot be linked is a feed that cannot be shared, and
sharing a feed of txs is the whole point of a social feed.

**why "HIDE SENT" and not a "SENT" filter.** a reader who has already
sent a tx does not want to see it again in their feed — it is done, it
is not actionable. but they might want to look at what they sent, so
hiding is a toggle and not a filter that replaces the list. the same
pattern the discover page's "marked" filter uses.

**why "MOST ACCOUNTS" is a sort.** it is the question "what is popular",
and it is the one question a social feed answers that a tx list does
not. it is a sort by the size of the WHO list.

### the post's actions

each post carries three actions:

| action | what it does |
|---|---|
| **ADD** / **REMOVE** | add YOUR account to the queue, or take it off |
| **SEND** | send the transactions in the wallet popup |
| **DETAIL** | go to the queue page |

**the ADD / REMOVE button is one button that says the opposite of what
it will do.** if your account is on the queue and has not sent it, the
button says REMOVE. if it is not on the queue, it says ADD. if you have
already sent it, there is nothing to add or remove, so the button is
gone and a status takes its place.

**why it is one button and not two.** two buttons side by side, one of
which is always wrong, is worse than one button that says what it will
do. the app does this already with the account dropdown's ✕ and with
the token picker's swap.

**the SEND button is the big one.** it is the primary action of the
post, so it is the one that looks like a button.

### the post's status line

a post says where it stands, in the reader's own terms:

- **not on the queue** — "ADD ME" or the ADD button
- **on the queue, not sent** — "WAITING" and a SEND button
- **sent, outcome unknown** — "SENT" with a link to the transaction
- **sent and worked** — a green tick and the link
- **sent and failed** — a red cross and the link

**why the status is per account and not per post.** a post can be sent by
alice and not by bob. the status line is about **the reader's** account
on that post, because that is the only status that means something to
them. the other accounts are listed on the post, but their statuses are
not the headline.

### the layout of a post

```
┌─────────────────────────────────────────┐
│ WHAT                                    │  the agent's headline
│                                         │
│ 1. ref.finance.near  ft_swap            │  the transactions, in order
│ 2. ref.finance.near  ft_resolve_transfer│
│                                         │
│ WHEN  when the price is right            │
│ WHY   you said to move half your usdc     │
│                                         │
│ for: alice.near, bob.near                │  the WHO
│ ✓ alice.near  ·  ○ bob.near               │
│                                         │
│ [ SEND ]  [ REMOVE ]  [ DETAIL ]         │  the actions
└─────────────────────────────────────────┘
```

**why the transactions are listed and not hidden behind DETAIL.** a
reader signs a transaction. they must be able to see WHAT they are
signing before they sign it — the contract, the method, and the args.
that is the same rule the swap page follows: the route is shown before
it is taken.

---

## 2. THE QUEUE PAGE — `?queue=<queue_id>`

the queue page is the detail view of one post. it has **several
components**, as you asked.

### the components

| component | what it shows |
|---|---|
| `SHIT_1170_COMPONENT_QUEUE_STATUS` | the status line — where this batch stands for the reader |
| `SHIT_1170_COMPONENT_QUEUE_SUMMARY` | the what / when / why card |
| `SHIT_1170_COMPONENT_QUEUE_TRANSACTIONS` | the transactions, in order, with their args |
| `SHIT_1170_COMPONENT_QUEUE_TRANSFERS` | **the ft transfers the transactions make** |
| `SHIT_1170_COMPONENT_QUEUE_ACCOUNTS` | the WHO — every account, its status and its hash |
| `SHIT_1170_COMPONENT_QUEUE_ACTIONS` | the buttons — ADD / REMOVE / SEND |
| `SHIT_1170_COMPONENT_QUEUE_TOASTS` | the toast layer, like the swap page's |

### the transfers component — the ft transfer reading

this is the piece you asked for, and it is the interesting one.

**the problem.** a queued transaction is a **function call** — a contract,
a method and some args. the args are raw json. `ft_swap` with
`{"amount": "100000000"}` tells a reader nothing about tokens. but the
swap page's card tells them "1.5 USDC", because the tx page's transfer
parser knows how to read a transaction's transfers.

**the shape of the answer.** a queued tx's args usually carry an ft
transfer in them — the token id, the amount, the receiver. so the
transfers component **reads the args** and pulls out the transfer it can
find:

| the method is | the args carry | the row shows |
|---|---|---|
| `ft_transfer` | `receiver_id`, `amount` | the token's icon, `1.5 USDC`, the receiver |
| `ft_transfer_call` | `receiver_id`, `amount`, `token_id` | the same, plus the token id |
| `ft_swap` | `token_in`, `token_out`, `amount` | the amount in, and what it is worth |
| anything else | nothing recognisable | nothing |

**the amount is read exactly as the tx page reads it.** the same
`SHIT_1170_TRANSFER_TOKENS_STORE` and the same
`shit_1170_transfer_amount_fun` component, so a queued transfer and a
finished transfer read the same way: the icon, the amount divided by the
token's decimals, the symbol, the usd worth, and the raw integer in the
title.

**why it is a component and not part of the transactions list.** the
transactions list is about the **calls** — the contract, the method, the
raw args. the transfers component is about the **tokens** — what moves,
how much, and what it is worth. they are two readings of the same
transaction, and they are laid out differently.

**why the token info is fetched.** the token's icon, symbol, decimals and
price all come from the token registry, and they are needed to turn
`100000000` into `1.5 USDC`. the fetch is the same one the tx page and
the account page make — one call for all the tokens in the batch.

**what happens when the args are not recognisable.** nothing. the row is
not drawn. a queued tx that moves no token shows no transfers section,
and the transactions list carries the whole story.

### the accounts component

one row per account in the WHO:

```
alice.near    ✓ sent      9hN3lq...  →  (link to the tx page)
bob.near      ○ waiting
carol.near    ✗ failed    AbCdEf...  →  (link to the tx page)
```

**the hash links to the transaction page**, the same link the swap page's
toast makes. that is the whole point of keeping the hash: the reader can
go and see what actually happened on the chain.

---

## 3. THE SIGN AND SEND FLOW

this is the part that touches the wallet, and it is the part most like
the swap page.

### the flow

```
reader clicks SEND
  → the transactions are built from the queue's HOW
  → ONE wallet popup, the whole batch
  → the wallet returns the outcomes
  → the outcomes are read for the hashes
  → the backend is told: the hashes, and whether each one worked
  → the post's status changes
  → a toast says what came of it
```

### the transactions are built from the queue

the queue's `transactions` are already in the toolbox's shape:

```ts
{
  receiver_id: contract_id,
  actions: [{ FunctionCall: { method_name: method, args, gas, deposit } }],
}
```

**why this needs no reshaping.** the queue row's `contract_id`,
`method`, `args`, `gas` and `deposit` map one to one onto
`generic_contract_transaction_type`. the frontend hands them to
`generic_contract_call_wallet` as they are.

**why `generic_contract_call_wallet` and not `generic_contract_call_fun`.**
`generic_contract_call_fun` takes a `Near` client and signs with a key —
that is the backend path. `generic_contract_call_wallet` takes the
**wallet** and hands it an array of transactions, which is the browser
path and is what puts the whole batch in one popup.

**the call is the same shape as the swap page's.** the swap page calls
`EXECUTE_ROUTE_FULL_BATCHED(wallet, route, {...})` — the dex aggregator's
batched executor. the feed calls
`generic_contract_call_wallet(wallet, transactions)` — the toolbox's
batched executor. both are: one wallet, one popup, an array of
transactions.

### the outcomes are read

`generic_contract_call_wallet` returns an array of `{ transaction_hash }`
— **only the hash**. it does not hand back the outcome, so the feed
cannot read the success or the failure from its return value.

**so the outcome has to be read from the wallet itself.** the wallet's
`signAndSendTransactions` is what returns the full outcomes, and the
toolbox throws them away after taking the hashes. so the feed asks the
wallet for the outcomes as well, the way the swap page's
`EXECUTE_ROUTE_FULL_BATCHED` does — the swap page reads
`result.swap_outcomes`, which are the full near-kit
`FinalExecutionOutcome` objects.

**this is a real difference from the swap page.** the swap page's
dex-aggregator returns the full outcomes. the toolbox's generic wallet
helper does not. so there are two options:

| | how | what it costs |
|---|---|---|
| **A** | the feed calls `wallet.signAndSendTransactions` itself, the way the toolbox does internally, and reads both the hash and the outcome from what it gets back | the feed reimplements the toolbox's ~30 lines, and keeps its shape |
| **B** | the feed calls `generic_contract_call_wallet` for the hashes, and then asks the **transaction page's** api for the outcome | the outcome is one more request per transaction, and it is not immediate |

**A is the better one** — the outcome is known at once, with no extra
request, and the batch is still one popup. but it means the feed is not
using the toolbox's helper, which is against the grain of the plan.

**this is question 10 in the list below.** it changes the send flow.

**the hash comes out the same way either way.** a near-kit outcome
carries its hash under `transaction.hash`, and the swap page's
`outcome_hash_fun` already knows that. so that helper moves to
`lib/ts/shared/` and both pages use it.

**why it is shared and not copied.** the swap page knows that a near-kit
outcome carries its hash under `transaction.hash`. copying it into the
feed would be two copies of the same knowledge, and one of them would
drift.

### the backend is told

one call, the whole batch:

```ts
await api_shit_1170_tx_queue_sent_post(base_url, {
  txHashes: [
    { txId: "1a2b...", txHash: "9hN3...", status: "succeeded" },
    { txId: "2b3c...", txHash: "AbCd...", status: "failed" },
  ],
}, session_options);
```

**the `status` is optional per entry.** when the outcome could not be
read, the entry carries no status and the backend records `sent` — the
tx happened and the outcome is not known yet. the reader can be told
later, or the feed can ask the chain next time it loads.

**why the queue's transactions are matched to the hashes by `txId`.** the
backend knows the order — the `position` column — but the wallet
returns the outcomes in the order it sent them, and a reader wants the
hash on the right transaction. sending the `txId` with each hash makes
the match explicit and does not rely on the order holding.

**why it is one call.** the wallet sent the whole batch in one popup, so
the app learned everything about the whole batch at once. one call
reports it all.

**the account comes from the api key.** the request carries the reader's
session key, and the backend knows that key belongs to that account. so
the body does not repeat the account id — the key IS the account.

### the toast

the swap page's toast layer, reused. the feed and the queue page both
mount `SHIT_1170_COMPONENT_SWAP_TOASTS`.

**why the toast component is shared and not copied.** it is already a
shared thing that sits over a page and links to a transaction. the feed
does the same thing the swap does. so it moves to
`components/shared/` and both pages mount it.

**what the toast says.**

| the outcome | the toast |
|---|---|
| everything worked | "SENT" and the link to the transaction |
| some worked | "SENT" and "2 of 3 transactions worked" |
| the reader declined | no toast — declining is not a failure, and the swap page does not toast on a decline either |
| the wallet threw | "error" and the message |

**why a decline is not a toast.** the reader said no. a toast that says
"it failed" for a deliberate no is telling the reader they did something
wrong. the swap page's toast behaves the same way.

---

## 4. THE FILES

### the feed page

```
frontend/app/index.html                  (changed — the body)
frontend/lib/ts/import-feed.ts           (changed — the imports)
frontend/lib/ts/feed/app_page_feed_start.ts        NEW
frontend/lib/ts/feed/app_page_feed_store.ts        NEW
frontend/lib/ts/feed/app_page_feed_load.ts         NEW
frontend/lib/ts/feed/app_page_feed_filter.ts      NEW
frontend/lib/ts/feed/app_page_feed_url.ts          NEW
frontend/lib/ts/feed/app_page_feed_actions.ts      NEW
frontend/lib/ts/feed/app_page_feed_send.ts         NEW
frontend/lib/ts/feed/app_page_feed_types.ts        NEW
frontend/lib/components/feed/app_page_feed_filters.tsx     NEW
frontend/lib/components/feed/app_page_feed_post.tsx        NEW
frontend/lib/components/feed/app_page_feed_status.tsx      NEW
frontend/lib/components/feed/app_page_feed_transactions.tsx NEW
frontend/lib/css/components/feed/SHIT_1170_COMPONENT_APP_PAGE_FEED_FILTERS.css   NEW
frontend/lib/css/components/feed/SHIT_1170_COMPONENT_APP_PAGE_FEED_POST.css      NEW
frontend/lib/css/components/feed/SHIT_1170_COMPONENT_APP_PAGE_FEED_STATUS.css    NEW
frontend/lib/css/components/feed/SHIT_1170_COMPONENT_APP_PAGE_FEED_TRANSACTIONS.css NEW
frontend/lib/css/import-feed.css          NEW
```

**why the feed's ts is in `lib/ts/feed/`** — the page pattern: one
folder per page, holding the page's fetching, its store and its start.

**why `app_page_feed_load.ts` is separate from the store.** the store
holds the state and owns the load; the loader holds the **requests**.
that split is the app's rule — the requests a page makes are knowable by
reading one file.

### the queue page

```
frontend/app/queue.html                          NEW
frontend/lib/ts/import-queue.ts                  NEW
frontend/lib/ts/queue/app_page_queue_start.ts    NEW
frontend/lib/ts/queue/app_page_queue_store.ts    NEW
frontend/lib/ts/queue/app_page_queue_load.ts     NEW
frontend/lib/ts/queue/app_page_queue_url.ts      NEW
frontend/lib/ts/queue/app_page_queue_types.ts    NEW
frontend/lib/ts/queue/app_page_queue_transfers.ts NEW  ← the ft transfer reading
frontend/lib/ts/queue/app_page_queue_send.ts     NEW
frontend/lib/components/queue/app_page_queue_status.tsx        NEW
frontend/lib/components/queue/app_page_queue_summary.tsx       NEW
frontend/lib/components/queue/app_page_queue_transactions.tsx  NEW
frontend/lib/components/queue/app_page_queue_transfers.tsx     NEW
frontend/lib/components/queue/app_page_queue_accounts.tsx      NEW
frontend/lib/components/queue/app_page_queue_actions.tsx       NEW
frontend/lib/css/components/queue/SHIT_1170_COMPONENT_QUEUE_STATUS.css       NEW
frontend/lib/css/components/queue/SHIT_1170_COMPONENT_QUEUE_SUMMARY.css      NEW
frontend/lib/css/components/queue/SHIT_1170_COMPONENT_QUEUE_TRANSACTIONS.css NEW
frontend/lib/css/components/queue/SHIT_1170_COMPONENT_QUEUE_TRANSFERS.css    NEW
frontend/lib/css/components/queue/SHIT_1170_COMPONENT_QUEUE_ACCOUNTS.css     NEW
frontend/lib/css/components/queue/SHIT_1170_COMPONENT_QUEUE_ACTIONS.css      NEW
frontend/lib/css/import-queue.css                 NEW
```

### the shared pieces that move

```
frontend/lib/ts/shared/session.ts        → api_key.ts        (renamed)
frontend/lib/ts/shared/session_token.ts  → api_key_token.ts  (renamed)
frontend/lib/ts/shared/outcome_hash.ts   NEW  ← outcome_hash_fun, moved out of
                                                  app_page_swap_execute.ts
frontend/lib/components/swap/app_page_swap_toasts.tsx
                                      → components/shared/toast_layer.tsx  (moved)
frontend/lib/ts/swap/app_page_swap_toast_store.ts
                                      → lib/ts/shared/toast_store.ts      (moved)
frontend/lib/ts/shared/mount_ids.ts      (changed — the new ids)
frontend/lib/ts/shared/tx_link.ts        (changed — a queue link builder)
```

**the toast's mount id changes** from `SHIT_1170_COMPONENT_SWAP_TOASTS` to
`SHIT_1170_COMPONENT_TOAST_LAYER`, because it is no longer the swap
page's. the swap page's html gets the new id, and the css file is
named after it: `SHIT_1170_COMPONENT_TOAST_LAYER.css`.

**the toast's tx link depth changes.** the toast store's `tx_link_fun`
hardcodes depth 0, because the swap page is at the top of `app/`. a
shared toast layer can sit on a page at any depth, so the link is built
with `current_app_depth_fun()` instead — the same helper the tx page's
transfer rows use.

**the toast layer is a fixed overlay, so there is one per page.** the
feed page and the queue page each mount their own layer element, and
they share the one store. a toast raised on the queue page does not
appear on the feed page, because the layers are separate and each one
renders what the store holds at the moment it renders.

**why the toast store moves to `shared/`.** the swap page's toast is a
generic "that worked / that did not" layer with a transaction link. the
feed and the queue page want the same thing. it is shared the moment two
pages use it, and the app's rule is that shared ts lives in
`lib/ts/shared/`.

**the toast's tx link depth changes.** the toast store's `tx_link_fun`
hardcodes depth 0, because the swap page is at the top of `app/`. a
shared toast layer can sit on a page at any depth, so the link is built
with `current_app_depth_fun()` instead — the same helper the tx page's
transfer rows use. one toast layer, any depth.

**the toast layer is a fixed overlay, so there is one per page.** the
feed page and the queue page each mount their own layer element, and
they share the one store. a toast raised on the queue page does not
appear on the feed page, because the layers are separate and each one
renders what the store holds at the moment it renders.

**why the toast store is a separate file from the toast component.** the
store is ts, the component is tsx. the app's rule is that ts lives in
`lib/ts` and tsx lives in `lib/components`.

**why `tx_link.ts` grows a queue link builder.** the app already has
`token_link.ts` and `tx_link.ts` — one link builder per thing that gets
linked to. the queue is now a third.

### the mount ids

```
SHIT_1170_COMPONENT_APP_PAGE_FEED_FILTERS
SHIT_1170_COMPONENT_APP_PAGE_FEED_POST
SHIT_1170_COMPONENT_APP_PAGE_FEED_STATUS
SHIT_1170_COMPONENT_APP_PAGE_FEED_TRANSACTIONS
SHIT_1170_COMPONENT_QUEUE_STATUS
SHIT_1170_COMPONENT_QUEUE_SUMMARY
SHIT_1170_COMPONENT_QUEUE_TRANSACTIONS
SHIT_1170_COMPONENT_QUEUE_TRANSFERS
SHIT_1170_COMPONENT_QUEUE_ACCOUNTS
SHIT_1170_COMPONENT_QUEUE_ACTIONS
```

**why the feed's ids say `APP_PAGE_FEED` and the queue's just say
`QUEUE`.** the app's naming is `SHIT_1170_COMPONENT_<PAGE>_<PART>`, and
the page folder is `feed/` and `queue/`. the feed page's html is
`index.html` — but the PAGE is the feed, not "index", so the ids name
the feed.

---

## 5. THE FILTER BAR, IN DETAIL

### the controls

```
┌──────────────────────────────────────────────────────┐
│ [ ALL ] [ MINE ]   [ HIDE SENT ]   [ NEWEST ▾ ]     │
└──────────────────────────────────────────────────────┘
```

| control | what it does | where it lives |
|---|---|---|
| **ALL / MINE** | all the queues, or only the ones the reader is on | the url's `account` |
| **HIDE SENT** | hide the queues the reader has already sent | the url's `hide_sent` |
| **NEWEST / OLDEST / MOST ACCOUNTS** | the sort | the url's `sort` |

**"MINE" is the default when the reader is signed in.** a reader who
signs in wants their own queue. a reader who is signed out gets all of
it.

**the account filter is the reader's account, not a free-text box.** the
reader filters by *themselves*. the "which account" question is answered
by the sign-in, not typed. that is the whole point of the account
filter — it is not a search box, it is "mine or everyone's".

**why the sort is a dropdown and not the shared sort control.** the
shared `sort_keys_control` is a row of small buttons with a direction
toggle. the feed's sort is a named set with no direction — "newest" and
"oldest" are two entries, not two directions of one key. so it is a
plain dropdown.

### the url

```
/app/index.html?account=alice.near&hide_sent=1&sort=newest
```

| parameter | values | default |
|---|---|---|
| `account` | an account id, or absent for all | the signed-in account |
| `hide_sent` | `1` | absent |
| `sort` | `newest`, `oldest`, `most_accounts` | `newest` |

**why the defaults are not written to the url.** a url that always
carries its defaults is noisy, and a link to the plain feed should open
the plain feed. the url only carries what the reader changed.

### the filter bar is its own component

`SHIT_1170_COMPONENT_APP_PAGE_FEED_FILTERS` reads the filter state and
writes it back. it does not fetch — it reads the store and calls the
store's setters. that is the app's rule: the ts files fetch, the
components display.

---

## 6. THE TOKEN READING — HOW THE ARGS BECOME AMOUNTS

this is the deepest part of the ui, and it is worth writing down.

### the two readings of a transaction

```
the TRANSACTIONS component   the CALLS
  contract_id                  ref.finance.near
  method                       ft_swap
  args                         { "amount": "100000000", "token_in": ... }
                               ↑ raw json, in a code block

the TRANSFERS component       the TOKENS
  icon                         [usdc icon]
  amount                       1.5 USDC        ($1.50)
  receiver                     alice.near
```

### how a transfer is found in the args

a small reader per known method. each one knows which arg is the token
and which arg is the amount:

```ts
// what a queued ft transfer looks like, per method.
const SHIT_1170_QUEUE_TRANSFER_READERS = [
  { method: "ft_transfer",       token_arg: null,       amount_arg: "amount", receiver_arg: "receiver_id" },
  { method: "ft_transfer_call",  token_arg: "token_id", amount_arg: "amount", receiver_arg: "receiver_id" },
  { method: "ft_resolve_transfer", token_arg: "token_id", amount_arg: "amount", receiver_arg: "receiver_id" },
];
```

**why the reader is per method and not a guess.** the arg names are not
the same on every contract — some call it `token_id`, some call it
`token`, some leave it out for a native token. a guess that looks for
`token_id` on a contract that calls it `token` finds nothing, and a
transfer that is not shown is a transfer the reader cannot see before
they sign it.

**why an unrecognised method shows no transfer.** the honest answer. the
transactions list still shows the raw args, so nothing is hidden — the
reader can see the call, they just do not get a pretty amount for it.

**why this is not the tx page's parser.** the tx page parses a
**finished transaction** — the chain's own records of what moved. this
reads a **queued call** — the args somebody wrote. they are different
sources and a different shape, so they are different readers. the
**rendering** is shared, which is the part that must not drift.

### the token info is fetched for the whole batch

one call for all the tokens in all the transactions, the same way the tx
page does it:

```ts
const ids = [...new Set(transactions.flatMap(transfer_token_ids_fun))];
const tokens = await SHIT_1170_TOKEN_INFO.get(ids);
```

**why one call for the whole batch.** a batch of three calls can name the
same token twice. one call for the set is one request and not three.

**why the icons are not counted by the loading bar.** they are `<img>`
tags and the browser loads them itself. they are decoration — the
amounts read without them. the app already does this on the tx page and
the account page.

---

## 7. THE ORDER OF THE WORK

each step leaves the app working.

1. **the shared pieces move** — the toast store and layer to `shared/`,
   the `outcome_hash_fun` helper to `shared/`, the api key rename
2. **the feed's url + filter + store** — the filter state, the url, the
   store, the loader
3. **the feed's components** — the filters bar, the post, the status,
   the transactions
4. **the feed's send flow** — the wallet popup, the outcomes, the
   backend report, the toast
5. **the queue page** — the html, the store, the loader, the components
6. **the transfers component** — the ft transfer reading, the token
   fetch, the shared rendering
7. **the css** — the feed's and the queue's
8. **the docs** — the page specs, the csvs, `README.md`

**why the shared pieces move first.** the toast layer and the outcome
helper are used by the feed, and the swap page has to keep working. so
they move first, the swap page is updated to the new location, and
nothing is broken along the way.

---

## 8. THE THINGS I AM NOT SURE ABOUT — TELL ME IF I AM WRONG

1. **the feed page replaces "COMING SOON!"** — it becomes the queue
   feed. is that right, or does the feed stay a landing page and the
   queue feed gets its own page?

2. **the sort options** — newest, oldest, most accounts. is "most
   accounts" the popularity sort you want, or something else?

3. **the "hide sent" toggle** — is it one toggle, or do you want a
   three-way: ALL / MINE / NOT SENT BY ME?

4. **the ft transfer reading** — the readers per method above are a
   start. the real list depends on which contracts you care about. do
   you want the reader to be a growing list of known methods, or should
   it try to guess from the arg names?

5. **the queue page's url** — `?queue=<queue_id>`. it could also be
   `?id=<queue_id>` to match the token page. `?queue=` says what it is.

6. **one popup per account** — the reader signs the whole batch for
   their own account. the other accounts on the queue sign separately.
   is that the flow?

7. **the toast on the queue page** — the queue page has its own toast
   layer, or does it share the feed's? the toast layer is a fixed
   overlay, so one per page is enough.

8. **the ADD button when the reader is signed out** — the button is
   there but says SIGN IN TO ADD? or is it hidden?

9. **the transactions list on the feed** — the full list, or the first
   two with "and 1 more"? a batch can be 50 transactions and the feed
   post is small.

10. **the outcome reading** — this is the one that matters. the
    toolbox's `generic_contract_call_wallet` returns **only the hashes**,
    so the success or failure cannot be read from it. the feed either:

    - **A** — calls `wallet.signAndSendTransactions` itself and reads
      both the hash and the outcome from the full outcomes. one popup, the
      outcome known at once, no extra request. but the feed reimplements
      the toolbox's helper.
    - **B** — calls the toolbox helper for the hashes, then asks the
      fastnear api for the outcome. the toolbox stays the toolbox, but it
      is an extra request per transaction and the outcome is not immediate.

    A is better on the merits. B keeps the toolbox as the only way a
    transaction is sent. which one?

---

## 9. THE FILE LIST

### new — the feed

```
frontend/lib/ts/feed/app_page_feed_start.ts
frontend/lib/ts/feed/app_page_feed_store.ts
frontend/lib/ts/feed/app_page_feed_load.ts
frontend/lib/ts/feed/app_page_feed_filter.ts
frontend/lib/ts/feed/app_page_feed_url.ts
frontend/lib/ts/feed/app_page_feed_actions.ts
frontend/lib/ts/feed/app_page_feed_send.ts
frontend/lib/ts/feed/app_page_feed_types.ts
frontend/lib/components/feed/app_page_feed_filters.tsx
frontend/lib/components/feed/app_page_feed_post.tsx
frontend/lib/components/feed/app_page_feed_status.tsx
frontend/lib/components/feed/app_page_feed_transactions.tsx
frontend/lib/css/components/feed/SHIT_1170_COMPONENT_APP_PAGE_FEED_FILTERS.css
frontend/lib/css/components/feed/SHIT_1170_COMPONENT_APP_PAGE_FEED_POST.css
frontend/lib/css/components/feed/SHIT_1170_COMPONENT_APP_PAGE_FEED_STATUS.css
frontend/lib/css/components/feed/SHIT_1170_COMPONENT_APP_PAGE_FEED_TRANSACTIONS.css
frontend/lib/css/import-feed.css
```

### new — the queue page

```
frontend/app/queue.html
frontend/lib/ts/import-queue.ts
frontend/lib/ts/queue/app_page_queue_start.ts
frontend/lib/ts/queue/app_page_queue_store.ts
frontend/lib/ts/queue/app_page_queue_load.ts
frontend/lib/ts/queue/app_page_queue_url.ts
frontend/lib/ts/queue/app_page_queue_types.ts
frontend/lib/ts/queue/app_page_queue_transfers.ts
frontend/lib/ts/queue/app_page_queue_send.ts
frontend/lib/components/queue/app_page_queue_status.tsx
frontend/lib/components/queue/app_page_queue_summary.tsx
frontend/lib/components/queue/app_page_queue_transactions.tsx
frontend/lib/components/queue/app_page_queue_transfers.tsx
frontend/lib/components/queue/app_page_queue_accounts.tsx
frontend/lib/components/queue/app_page_queue_actions.tsx
frontend/lib/css/components/queue/SHIT_1170_COMPONENT_QUEUE_STATUS.css
frontend/lib/css/components/queue/SHIT_1170_COMPONENT_QUEUE_SUMMARY.css
frontend/lib/css/components/queue/SHIT_1170_COMPONENT_QUEUE_TRANSACTIONS.css
frontend/lib/css/components/queue/SHIT_1170_COMPONENT_QUEUE_TRANSFERS.css
frontend/lib/css/components/queue/SHIT_1170_COMPONENT_QUEUE_ACCOUNTS.css
frontend/lib/css/components/queue/SHIT_1170_COMPONENT_QUEUE_ACTIONS.css
frontend/lib/css/import-queue.css
```

### new — shared

```
frontend/lib/ts/shared/outcome_hash.ts
frontend/lib/ts/shared/toast_store.ts
frontend/lib/components/shared/toast_layer.tsx
```

**the toast's mount id changes** from `SHIT_1170_COMPONENT_SWAP_TOASTS` to
`SHIT_1170_COMPONENT_TOAST_LAYER`, because it is no longer the swap
page's. the swap page's html gets the new id, and the css file is
named after it: `SHIT_1170_COMPONENT_TOAST_LAYER.css`.

**the toast's tx link depth changes.** the toast store's `tx_link_fun`
hardcodes depth 0, because the swap page is at the top of `app/`. a
shared toast layer can sit on a page at any depth, so the link is built
with `current_app_depth_fun()` instead — the same helper the tx page's
transfer rows use.

**the toast layer is a fixed overlay, so there is one per page.** the
feed page and the queue page each mount their own layer element, and
they share the one store. a toast raised on the queue page does not
appear on the feed page, because the layers are separate and each one
renders what the store holds at the moment it renders.

### changed

```
frontend/app/index.html                          the body
frontend/lib/ts/import-feed.ts                   the imports
frontend/lib/ts/shared/mount_ids.ts              the new ids
frontend/lib/ts/shared/tx_link.ts                the queue link builder
frontend/lib/ts/swap/app_page_swap_execute.ts    outcome_hash_fun moved out
frontend/lib/ts/swap/app_page_swap_toast_store.ts   moved to shared/
frontend/lib/components/swap/app_page_swap_toasts.tsx  moved to shared/
frontend/lib/ts/shared/session.ts                renamed api_key.ts
frontend/lib/ts/shared/session_token.ts          renamed api_key_token.ts
frontend/lib/ts/import-swap.ts                   the toast's new home
frontend/lib/ts/import-tx.ts                     if it uses the toast
```

### changed — docs

```
DOCS/PAGES/README.md
DOCS/PAGES/frontend.app.index.md
DOCS/PAGES/frontend.app.queue.md          NEW
DOCS/PAGES/components.csv
DOCS/PAGES/requests.csv
```

========================================
<br/>
copyright 2026 by sleet.near
