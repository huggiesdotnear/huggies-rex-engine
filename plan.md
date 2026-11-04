# PLAN — TX QUEUE

> status: **awaiting review**. nothing below has been built yet.
> this file is the plan. it goes away when the work is done.

the plan for the **tx queue**: agents queue one or more function calls
for a user, the user signs them, the queue records what happened.

> --- HOW --- this session is **BUILD AND TEST ONLY**. nothing is
> deployed live. the container is not rebuilt against the live site, and
> the live site is not touched. the db that is wiped is the **local** one.
> the live deploy is a separate session.

---

## 0. THE ONE BIG WORDING FIX

you said the "session key" was wrongly named and should be called the
**api key**. so, everywhere in this plan:

| old name | new name | what it is |
|---|---|---|
| session key | **api key** | the bearer token the user hands to an agent |
| `x-session-token` header | `x-api-key` header | where the api key travels |
| `sessions` table | `api_keys` table | the table the api keys live in |
| `sessions_store.rs` | `api_keys_store.rs` | the store for that table |
| `POST /api/shit-1170/sessions` | `POST /api/shit-1170/api-keys` | minting one |
| `GET /api/shit-1170/session/me` | `GET /api/shit-1170/api-key/me` | who a key belongs to |
| `POST /api/shit-1170/session/rotate` | `POST /api/shit-1170/api-key/rotate` | replace one |

**why this is right, not just a rename.** the current "session key" is
already exactly the credential you described: the user signs in once with
NEP-413, the backend hands out one long-lived key, and that key is what
the user gives to the agent. the agent then holds a bearer token for the
user's account. calling it a *session* key describes the browser's
short-lived use of it; calling it an *api* key describes what it
actually is — a long-lived credential for calling this backend, which a
third party (the agent) holds.

the value on the wire does not change shape: it stays the
`shit_1170_` prefix plus 64 hex chars. the header name changes, and
both names are accepted during the beta so an old agent keeps working.

**this is a breaking change on the db, and that is fine** — you said the
data can be erased. the db file is wiped and rebuilt.

---

## 1. THE SHAPE OF A QUEUED TX

a queued tx is **WHAT, WHEN, WHY, WHO, HOW**.

### a queue holds ONE OR MORE TRANSACTIONS

a `queue_id` is **a batch of transactions**, not one transaction. the
agent queues a swap, and that swap needs three function calls — a
deposit, the swap itself, and a withdrawal — so they go in together
under one `queue_id`, and the user signs them **as one batch, in one
wallet popup**.

this matches the toolbox: `generic_contract_call_fun` takes a
transaction, and `generic_contract_call_wallet` takes an **array** of
transactions and hands them to the wallet at once. one popup, not three.

so the model is three levels deep:

```
a QUEUE  (queue_id)          what / when / why
  └── a TRANSACTION          contract_id / method / args / gas / deposit
        └── an ACCOUNT ROW    account_id / status / tx_hash
```

### WHAT, WHEN, WHY — free text, on the QUEUE row

| field | meaning | required |
|---|---|---|
| `what` | what the txs do, in words | no |
| `when` | when they should happen, in words — "when the market opens", "after the price drops below 0.5" | no |
| `why` | why the user wants them | no |
| `when_at` | the machine-readable version of `when`, epoch ms | no |

**why `when` is text AND `when_at` is a timestamp.** you asked for the
string, like `what` and `why` — and that is right, because most of the
time "when" is a *condition*, not a moment: "when the price is right",
"after this proposal passes". a string can say that and a timestamp
cannot. but some requests really are "at 10:00 on friday", and that
needs a number the machine can sort on and the ui can count down to.
so both: `when` is the human sentence, `when_at` is the optional
machine time. `when_at` is `NULL` when there is no moment.

**why they are all nullable.** the agent may know the `what` and not the
`why`. an agent that must fill all three would make one up, and a made-up
`why` is worse than no `why`.

**why what/when/why are on the queue and not on the transaction.** they
describe the **batch**, not one call. "swap 100 USDC for NEAR" is the
what of three calls taken together. if they were on the transaction
row, three calls would carry three copies of the same sentence.

### WHO — one row per account, per transaction

the WHO is **not** a json array. it is a table, one row per account,
joined back to the transaction. your original spec —

> The WHO will be an Array of objects. One object for each account id
> ... The object should contain account id, status of if they sent the
> TX or have yet to. And the tx hash when sent.

— maps onto the table exactly. each object in your array is one row, and
your three fields are three columns:

| your array object | its column |
|---|---|
| `accountId` | `account_id` |
| `status` | `status` |
| `txHash` | `tx_hash` |

the array you read on the wire is those rows serialized back to a list.
nothing is added and nothing is lost.

**why the account row hangs off the TRANSACTION and not off the QUEUE.**
this is the part that matters with a batch. a queue has three
transactions; the user signs all three together; **each transaction
produces its own hash**. so the hash cannot live on the account row of
the queue, or three hashes would collide in one column.

so the account row is per **account + transaction**:

```
queue_id + tx_id + account_id  ->  status, tx_hash
```

**who is on a queue.** the WHO rows of a queue are **the accounts that
have sent one of its transactions**, plus **the accounts the agent
named when it queued it**. both are the same rows:

- the agent names accounts at queue time → rows with `status = pending`
  and no hash. that is how alice knows the tx was meant for her and sees
  it in her feed.
- alice signs → **her same row** becomes `status = sent` with the hash.
- a NEW account that was never named signs → a row is created for it,
  so it appears in the queue's WHO list too.

so the WHO list grows as people send, and the status says who has sent
and who has not. there is no separate "suggested" flag and no separate
list — it is one list of one row per account, exactly as you described.

**the account is the join.** an account can sign **any** queue. the queue
is an open offer: anyone who sees it can send it, and their account
joins the WHO list when they do.

### THE RULE THAT MATTERS MOST — WHO MAY BE NAMED

there are **two different rules** here, and they pull in opposite
directions. keeping them apart is the whole security story of the queue.

| | who it is | the rule |
|---|---|---|
| **NAMING** | the **agent** queues a tx and names the accounts it is for | the agent may name **ONLY accounts whose api key it holds** |
| **SIGNING** | a **user** sees a tx in their feed and signs it | any signed-in user may sign **any** queue they can see |

**why the naming rule exists.** the WHO list is what puts a tx in
somebody's feed. if an agent could name any account id it liked, agent A
could fill agent B's users' feeds with txs they never asked for — and
the ui filters by account, so those users would keep seeing them. one
agent would be spamming another agent's users through the queue.

**so the agent's WHO list is its OWN users, and only its own users.**
the agent holds an api key per user it serves. it may name those. it may
not name anybody else. the backend checks this at queue time: every
account in the `accounts` list must resolve to a key the calling agent
holds, and one that does not is a `400`.

**why the signing rule is still open.** the queue is an open offer. a
user who sees a tx may send it, and their account joins the WHO list.
that is a user acting for themselves with their own key — no agent is
putting it in front of them, they found it and chose it.

**the two rules together:**

- an agent can only ever address **its own** users
- a user can act on **any** tx, including one another agent queued

so the queue never becomes a spam channel between agents, and it never
becomes a closed club either.

### the STATUS — four states, on the account row

| status | meaning |
|---|---|
| `pending` | on the queue, not signed yet |
| `sent` | signed and sent — the outcome is not known yet |
| `succeeded` | it went through |
| `failed` | it did not work |

**why the status lives ONLY on the account row.** it is the one place
where the truth is. a transaction is not "sent" or "failed" on its own —
it is sent **by an account**, and each account's send is its own
transaction with its own hash and its own outcome. two accounts sending
the same queued transaction produce two different on-chain transactions,
and either can succeed while the other fails.

**there is no global "is this queue done" status, and that is deliberate.**
a queue is never finished. at any moment another account can decide they
want to send it, and they join. the ui does not need a done badge —
it needs to know, per account, whether that account has sent it. that is
what the account row's status is for.

### HOW — the function call

this matches the near-kit toolbox `generic_contract_call_fun` type
exactly. only function calls can be queued — no transfers, no key
management, no account creation. each transaction row carries:

| field | meaning |
|---|---|
| `contract_id` | the contract being called |
| `method` | the method name |
| `args` | the arguments, as a json object |
| `gas` | the gas, as a string (the toolbox takes `number \| string`) |
| `deposit` | the deposit, as a string (the toolbox takes `number \| string \| bigint`) |

**why `contract_id`, `method` and `args` have their own columns and not
one json blob.** you asked for this, and you were right: the plan is to
later show "the most common contracts and methods" in the ui. a
`contract_id` column with an index answers "how many queued txs hit
`ref.finance.near`" with a `GROUP BY`. inside a json blob it is a json
scan on every row, every time. `args` stays a json column because it is
a bag of arbitrary keys with no shape — there is nothing to group by.

the wire shape of `args` matches the toolbox: a json object whose values
are strings, numbers, booleans, or nested json.

---

## 2. THE DATABASE

### the tables

**`api_keys`** (the renamed `sessions` table)

```
account_id         TEXT    NOT NULL PRIMARY KEY
api_key            TEXT    NOT NULL
api_key_hash       TEXT    NOT NULL
created_at         INTEGER NOT NULL
updated_at         INTEGER NOT NULL
```

**`tx_queue`** — one row per queued BATCH

```
queue_id           TEXT    NOT NULL PRIMARY KEY
what               TEXT
when               TEXT
why                TEXT
when_at            INTEGER
created_at         INTEGER NOT NULL
updated_at         INTEGER NOT NULL
```

**`tx_queue_transactions`** — one row per transaction in a batch

```
tx_id              TEXT    NOT NULL PRIMARY KEY
queue_id           TEXT    NOT NULL
position           INTEGER NOT NULL
contract_id        TEXT    NOT NULL
method             TEXT    NOT NULL
args               TEXT    NOT NULL
gas                TEXT
deposit            TEXT
created_at         INTEGER NOT NULL
updated_at         INTEGER NOT NULL
FOREIGN KEY (queue_id) REFERENCES tx_queue(queue_id) ON DELETE CASCADE
```

**`tx_queue_accounts`** — one row per account, per transaction

```
queue_id           TEXT    NOT NULL
tx_id              TEXT    NOT NULL
account_id         TEXT    NOT NULL
status             TEXT    NOT NULL DEFAULT 'pending'
tx_hash            TEXT
created_at         INTEGER NOT NULL
updated_at         INTEGER NOT NULL
PRIMARY KEY (tx_id, account_id)
FOREIGN KEY (tx_id) REFERENCES tx_queue_transactions(tx_id) ON DELETE CASCADE
```

**there is NO status column on `tx_queue` and NO status column on
`tx_queue_transactions`.** the status lives on the account row and
nowhere else. a queue is never done, so there is nothing for a queue
status to say.

### `position` is the order of the transactions

a batch of three calls has an order: the deposit comes first, the swap
second, the withdrawal third. `position` is that order, and it is
`0, 1, 2` within the queue.

**why the order is a column and not the rowid.** sqlite hands out rowids
that depend on the insert order and the vacuum state. `position` is
explicit, and it is what the wallet popup needs — the wallet gets the
transactions in the order the agent wrote them.

**why there is no `queue_id` on the account row's primary key.** the
primary key is `(tx_id, account_id)` — the account row is about one
transaction. the `queue_id` is kept as a column anyway, so a query for
"every account on this queue" is one indexed read with no join through
the transactions table.

### the indexes

they are there for the endpoints you asked for, and each one has a
reason:

| index | serves |
|---|---|
| `tx_queue_transactions_contract_id_idx` | "how many txs for this contract" and "the most common contracts" |
| `tx_queue_transactions_method_idx` | "the most common methods" |
| `tx_queue_transactions_queue_id_idx` | "the transactions of this queue", in order |
| `tx_queue_transactions_created_at_idx` | the feed list, newest first |
| `tx_queue_accounts_account_id_idx` | "the txs for THIS account" — the feed filter |
| `tx_queue_accounts_queue_id_idx` | "the accounts on this queue" |
| `tx_queue_accounts_status_idx` | "the txs this account has not sent yet" |
| `api_keys_api_key_hash_idx` | the api key lookup on every authenticated request |

### `queue_id` and `tx_id` are uuids

both are random uuid v4, generated by the backend. `queue_id` is in
every url and is what the agent quotes back when it wants to update a
tx. `tx_id` names one transaction inside a batch.

**why not an integer autoincrement.** the id goes into a url that a user
pastes and an agent quotes. a uuid does not tell anyone how many txs
exist, and it cannot be guessed to read someone else's queue.

**why `tx_id` is a uuid and not `queue_id` + `position`.** the position
is renumbered when a transaction is removed from the middle of the
batch. a url that named a transaction by its position would then point
at a different transaction. the uuid does not move.

### the db is wiped

the db file is deleted and rebuilt. the old `sessions` table is gone,
replaced by `api_keys`. the session keys in it are gone too — which
means **every signed-in user has to sign in again**. that is the cost of
the rename, and you said the data can go.

**the local db only.** this session does not deploy. the live site's db
is untouched until the deploy session.

---

## 3. THE BACKEND — DB LAYER CLEANUP

the current `db_schema.rs` has one file holding one big `CREATE TABLE`
string for a db with one table. with three tables that stops working.
the plan is **one clearly named file per table**, and one file that runs
them.

### the files

```
src/backend/logic/db/
  db_open_fun.rs              (exists, keep)
  db_schema_run_fun.rs        NEW  — runs the table creates
  db_table_api_keys_fun.rs    NEW  — the api_keys table
  db_table_tx_queue_fun.rs    NEW  — the tx_queue table
  db_table_tx_queue_transactions_fun.rs  NEW  — the transactions table
  db_table_tx_queue_accounts_fun.rs  NEW  — the accounts table
  vault_db_path_fun.rs         (exists, keep)
  mod.rs                       (updated — the module list)
```

**why one file per table.** each table file holds that table's `CREATE
TABLE` and its indexes, and nothing else. a table's shape is read in one
place. `db_schema_run_fun.rs` holds the list of table files and runs
them in order in one transaction — that is the only file that knows
there are three tables.

**why `db_schema.rs` goes away.** the name says "the schema" but the
file held one table's sql and a runner, and the runner was in the same
file as the sql. splitting them is the cleanup you asked for.

### the store files

each table gets a store, and the store is where the sql lives:

```
src/backend/logic/endpoint_shit_1170_api_keys/
  api_key_fun.rs                    — make a key, hash it
  api_keys_store.rs                 — the api_keys sql
  api_key_of_header_fun.rs          — pull the key out of the header
  api_key_account_fun.rs            — the account a key belongs to
  mod.rs

src/backend/logic/endpoint_shit_1170_tx_queue/
  tx_queue_store.rs                 — the tx_queue sql
  tx_queue_transactions_store.rs    — the tx_queue_transactions sql
  tx_queue_accounts_store.rs        — the tx_queue_accounts sql
  tx_queue_args_fun.rs              — the args json <-> column
  tx_queue_row_to_json_fun.rs       — a row -> the wire shape
  tx_queue_auth_fun.rs              — the shared "whose queue is this" check
  tx_queue_named_accounts_fun.rs    — the NAMING rule: the accounts the agent may name
  tx_queue_uuid_fun.rs              — the uuid maker
  mod.rs
```

**why `tx_queue_args_fun.rs` exists.** the `args` column is a json
string and the wire shape is a json object. the conversion lives in one
file so the two can never disagree, and so a bad args blob is caught in
one place.

**why `tx_queue_auth_fun.rs` exists.** three routes need the same
question answered — "is the caller allowed to touch this queue?" — and
the answer is: the caller's api key belongs to an account that is ON the
queue. that check is written once.

**there is no `tx_queue_status_fun.rs`.** the status lives on the
account row and nowhere else, so there is no rule to write down and no
level that can disagree with another. the account row's status IS the
status.

**the query is in `tx_queue_store.rs`.** it is the list query, and the
store is where the sql lives. the `hide_sent` shape is written down
here so it is written down once.

**why `tx_queue_named_accounts_fun.rs` exists.** the NAMING rule — an
agent may only name accounts whose api key it holds — is a check over
a list, and it is used by the queue route. the file takes the agent's
own account and the list of accounts it wants to name, and answers with
the ones it is allowed to name. the check lives in one place so the rule
cannot be written two ways.

### the `hide_sent` query

this is the one query in the plan that is not a straight read, so it is
worth writing out.

**what it has to answer.** "the queues this account is on, minus the
ones this account has already sent".

**the shape of the answer.** a queue is on the account's list when the
account has a row under one of its transactions. the account has SENT it
when one of those rows carries a hash.

```
a queue is on the list when:
  EXISTS a row in tx_queue_accounts
    WHERE tx_queue_accounts.account_id = <the account>
      AND tx_queue_accounts.queue_id  = tx_queue.queue_id

a queue is HIDDEN when:
  EXISTS a row in tx_queue_accounts
    WHERE tx_queue_accounts.account_id = <the account>
      AND tx_queue_accounts.queue_id  = tx_queue.queue_id
      AND tx_queue_accounts.tx_hash IS NOT NULL
```

**so the two are one query with a `NOT EXISTS`.** the account rows
table carries `queue_id` as a column precisely so this does not have to
join through the transactions table.

```sql
SELECT ...
  FROM tx_queue
 WHERE ( ?account_id IS NULL
     OR EXISTS (SELECT 1 FROM tx_queue_accounts a
                 WHERE a.queue_id = tx_queue.queue_id
                   AND a.account_id = ?account_id) )
   AND ( ?hide_sent IS NULL OR ?hide_sent = 0
     OR NOT EXISTS (SELECT 1 FROM tx_queue_accounts s
                     WHERE s.queue_id = tx_queue.queue_id
                       AND s.account_id = ?account_id
                       AND s.tx_hash IS NOT NULL) )
 ORDER BY tx_queue.created_at DESC
 LIMIT ?limit OFFSET ?offset
```

**why the account's OWN row is what counts.** a queue can be sent by
alice and not by bob. the filter asks about the account that is being
filtered, and nobody else's send changes the answer.

**why `tx_hash IS NOT NULL` and not `status <> 'pending'`.** the hash is
the fact. the status is a label that could be `sent`, `succeeded` or
`failed` — three values that all mean "it went out". the hash is one
column that answers the question directly, and it is the column the
account row is built around.

**why the index carries it.** `tx_queue_accounts_account_id_idx` is on
`account_id`, and the query filters on it first. the `queue_id` is the
primary key's second half, so the lookup finds the account's rows and
walks them.

**the `?1` bind syntax, and why one parameter can be used twice.**
the query uses `?1` and `?2` — the numbered form the sessions store
already uses — and the SAME `?1` appears three times in it, because
the account id is wanted in the `EXISTS` and again in the `NOT EXISTS`.

that works, and it is worth knowing why. sqlx's sqlite driver reads the
bind parameter NAMES off the statement, and when a name is `?NNN` it
binds argument NNN to that slot. so `?1` is not "the next argument" —
it is "argument one" — and it can be written as many times as the query
wants. a plain `?` would be positional and could not be reused.

**the optional filters bind an `Option`.** `?1 IS NULL` is the test for
"this filter was not given". so the account id binds as
`Option<&str>` — `None` when there is no filter, `Some` when there is
one — and the same bind works for both shapes of the query without two
statements.

this was checked against sqlx 0.9 with a real query before the plan was
written, not assumed.

**why the queue's own `status` column is not in this.** there is none.
the whole point is that the status lives on the account rows, and this
query reads them where they are.

---

## 4. THE ROUTES

everything under `/api/shit-1170/`. the api key travels in the
`x-api-key` header (the old `x-session-token` header is still accepted).

### the queue routes

| method | path | what it does |
|---|---|---|
| `POST` | `/api/shit-1170/tx-queue` | queue a batch of transactions |
| `GET` | `/api/shit-1170/tx-queue` | the queue list, filterable |
| `GET` | `/api/shit-1170/tx-queue/{queue_id}` | one queued batch, with its transactions and accounts |
| `POST` | `/api/shit-1170/tx-queue/{queue_id}/accounts` | add YOUR OWN account to a queued batch |
| `DELETE` | `/api/shit-1170/tx-queue/{queue_id}/accounts/{account_id}` | remove YOUR OWN account from a queued batch |
| `POST` | `/api/shit-1170/tx-queue/{queue_id}/sent` | record that transactions were sent — the hashes and the outcome |
| `GET` | `/api/shit-1170/tx-queue/stats/contracts` | how many queued txs per contract |
| `GET` | `/api/shit-1170/tx-queue/stats/methods` | how many queued txs per method |

### the api key routes (the renamed session routes)

| method | path | what it does |
|---|---|---|
| `POST` | `/api/shit-1170/api-keys` | sign in → get an api key (was `/sessions`) |
| `GET` | `/api/shit-1170/api-key/me` | who this api key belongs to (was `/session/me`) |
| `POST` | `/api/shit-1170/api-key/rotate` | replace an api key (was `/session/rotate`) |

### the filters on the queue list

| query param | what it does |
|---|---|
| `account_id` | only the queues this account is on |
| `hide_sent` | with `account_id`, drop the queues this account has already sent |
| `contract_id` | only the queues holding a tx for this contract |
| `method` | only the queues holding a tx for this method |
| `limit` | how many, default 50 |
| `offset` | where to start, default 0 |

**there is no `status` filter.** the status is per account and per
transaction, and a queue has no global status to filter on.

**`hide_sent` is about the account, never about everybody.** it takes
`account_id` and it means "the queues this account is on, minus the ones
this account has already sent". it is a filter on ONE account's view.

**why `hide_sent` needs `account_id`.** "has this account sent it" is
a question about one account. there is no such question about all the
accounts, because a queue can be sent by alice and not by bob — so
there is no single answer to "has this queue been sent". the filter
therefore names the account it is about, and `account_id` is that
account.

**why the api does it and not the frontend.** the frontend would have to
fetch every queue, read every account row, and work out which ones the
reader has sent — and then throw most of them away. the api can do it
in the query, so the reader gets the twenty they asked for and not two
hundred they did not.

**the list is open.** anyone with an api key can list the queues. a
queue is an open offer, and hiding it would defeat the point.

**the feed's two views, and what each asks for:**

| the reader is looking at | the request |
|---|---|
| **ALL** | no filters. every queue, sent or not — a sent tx is still worth seeing, and the reader wants to see who did it |
| **MINE, hide sent** | `account_id=<theirs>&hide_sent=1` — the queues they are on that they have not sent yet. the actionable ones |

---

## 5. THE ROUTES IN DETAIL

### `POST /api/shit-1170/tx-queue` — queue a batch

**auth.** the `x-api-key` header must hold a key that belongs to some
account. that account is the one the batch is queued FOR. the agent
cannot queue a batch for an account it does not hold a key for.

**the body.**

```json
{
  "what": "swap 100 USDC for NEAR on the ref finance dex",
  "when": "when the price is right",
  "why": "you said to move half your usdc into near",
  "whenAt": 1772666400000,
  "transactions": [
    {
      "contractId": "ref.finance.near",
      "method": "ft_swap",
      "args": { "receiver_id": "alice.near", "amount": "100000000", "token_in": "usdt.tether-token.near", "token_out": "wrap.near" },
      "gas": "30000000000000",
      "deposit": "1"
    },
    {
      "contractId": "ref.finance.near",
      "method": "ft_resolve_transfer",
      "args": { "token_id": "usdt.tether-token.near", "receiver_id": "alice.near", "amount": "100000000" },
      "gas": "30000000000000",
      "deposit": "1"
    }
  ],
  "accounts": ["alice.near", "bob.near"]
}
```

`transactions` is a LIST. one entry is a batch of one. the order in the
list is the order the transactions are sent in, and it becomes the
`position` column.

`accounts` is the WHO — the accounts the agent is queuing this for. it
is **optional**, and **every account in it must be one the agent holds an
api key for** — the NAMING rule above. an account the agent has no key
for is refused with a `400`, so an agent cannot drop a tx into somebody
else's feed.

those accounts get rows with `status = pending`, so they see the tx in
their feed before anyone has signed it.

**the cap.** at most **50** transactions in one batch. a wallet popup
with 200 transactions is unreadable and slow. more than 50 is a `400`.

**the answer.** `201` with the queued batch:

```json
{
  "queueId": "8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11",
  "what": "swap 100 USDC for NEAR on the ref finance dex",
  "when": "when the price is right",
  "why": "you said to move half your usdc into near",
  "whenAt": null,
  "transactions": [
    {
      "txId": "1a2b3c4d-0000-0000-0000-000000000001",
      "position": 0,
      "contractId": "ref.finance.near",
      "method": "ft_swap",
      "args": { "receiver_id": "alice.near" },
      "gas": "30000000000000",
      "deposit": "1",
      "accounts": [
        { "accountId": "alice.near", "status": "pending", "txHash": null },
        { "accountId": "bob.near", "status": "pending", "txHash": null }
      ]
    }
  ],
  "accounts": [
    { "accountId": "alice.near", "status": "pending" },
    { "accountId": "bob.near", "status": "pending" }
  ],
  "createdAt": 1772666000000,
  "updatedAt": 1772666000000
}
```

the queue's own `accounts` list is the WHO across the whole batch — the
union of the transactions' account rows. a transaction's `accounts` list
is the same rows under that transaction, with that transaction's status
and hash for each.

**the errors.**

- `401` — no api key, or the key is not one of ours
- `400` — no transactions, more than 50, a transaction had no contract
  id, no method, or args that were not a json object, or the `accounts`
  list named an account the agent holds **no api key for** — the
  NAMING rule, and the one that stops one agent spamming another
  agent's users
- `500` — the db could not be reached

### `GET /api/shit-1170/tx-queue` — the list

**auth.** an api key is required. the list is open to anyone with a key.

**the query.**

```
GET /api/shit-1170/tx-queue?account_id=alice.near&hide_sent=1&limit=50&offset=0
```

| param | what it does |
|---|---|
| `account_id` | only the queues this account is on |
| `hide_sent` | `1` drops the ones this account has sent. it needs `account_id` |
| `contract_id` | only the queues holding a tx for this contract |
| `method` | only the queues holding a tx for this method |
| `limit` | default 50 |
| `offset` | default 0 |

**`hide_sent` without `account_id` is a `400`.** the filter is about one
account, and without an account there is no account to be about. saying
so is better than quietly ignoring it and returning the whole list.

**the answer.** `{ "items": [ ...one batch each... ], "total": 1 }`,
where each item is the same shape as the `201` answer above.

**the `total` is the count BEFORE `limit` and `offset`.** it is how many
queues matched, so a client knows how many pages there are.

### `GET /api/shit-1170/tx-queue/{queue_id}` — one batch

the same shape as one item of the list. `404` when there is no such
queue.

### `POST /api/shit-1170/tx-queue/{queue_id}/accounts` — add YOUR OWN account

the body:

```json
{ "accountId": "alice.near" }
```

**the rule.** the api key in the header must belong to that very
account. you can only ever add **yourself**. that is the check:

```
the header's api key -> the account it belongs to == body.accountId
```

if they do not match, `403`.

**what it writes.** an account row for every transaction of the batch,
with `status = pending`. this is how alice says "I want this one" before
she has signed it, and it puts the tx in her feed.

**the errors.**

- `401` — no api key
- `403` — the key is not this account's
- `404` — no such queue
- `409` — the account is already on the queue

### `DELETE /api/shit-1170/tx-queue/{queue_id}/accounts/{account_id}` — remove YOUR OWN account

the same rule: the key must belong to the account being removed. you can
remove yourself from a queue, and only yourself.

**what it writes.** the account's rows under every transaction of the
batch are deleted. a row that already carries a hash is **history** and
is not deleted — the tx happened, and the queue shows who did it.

`200` with the queue, or `404` when the account was not on it.

### `POST /api/shit-1170/tx-queue/{queue_id}/sent` — record that it was sent

the body:

```json
{
  "txHashes": [
    { "txId": "1a2b3c4d-0000-0000-0000-000000000001", "txHash": "9hN3lq...", "status": "succeeded" },
    { "txId": "1a2b3c4d-0000-0000-0000-000000000002", "txHash": "AbCdEf...", "status": "failed" }
  ]
}
```

**one call for the whole batch.** the wallet sent every transaction in
one popup, so the app reports every hash in one call.

`txId` is required on each entry — it says which transaction of the
batch this hash belongs to. `status` is optional: `succeeded` or
`failed`. when it is left out the status is `sent`, which means "we do
not know the outcome yet".

**the rule.** the key must belong to the account whose rows are being
written, and that account must be on the queue. the account comes from
the header — the key IS the account — so the body does not repeat it.

**what it writes.** for each entry:

- the account's row under that `tx_id` is created if it is not there
  (a new account signing joins the queue), and its `status` and
  `tx_hash` are written.

**the errors.** `400` when there are no hashes, `401`, `403`, `404`.

### `GET /api/shit-1170/tx-queue/stats/contracts` — the popular contracts

```json
{ "items": [ { "contractId": "ref.finance.near", "count": 12 } ] }
```

ordered by count, biggest first. a `limit` query param, default 20.

### `GET /api/shit-1170/tx-queue/stats/methods` — the popular methods

```json
{ "items": [ { "method": "ft_swap", "contractId": "ref.finance.near", "count": 9 } ] }
```

ordered by count, biggest first. `limit`, default 20.

**why the methods carry the contract id.** `ft_swap` on two different
contracts is two different transactions. a method count without the
contract would blend them, and "the most common methods" would be a
misleading number.

**why these two exist now, when the ui does not use them yet.** you
asked for them, and the query is the whole reason the columns are
columns. they are cheap (`GROUP BY` on an index) and they are what the
ui will read later.

---

## 6. THE MIDDLEMAN

one typed client per route, following the existing naming:

```
middleman/src/fun/
  api_shit_1170_api_keys_post.ts
  api_shit_1170_api_key_me_get.ts
  api_shit_1170_api_key_rotate_post.ts
  api_shit_1170_tx_queue_post.ts
  api_shit_1170_tx_queue_get.ts
  api_shit_1170_tx_queue_one_get.ts
  api_shit_1170_tx_queue_accounts_post.ts
  api_shit_1170_tx_queue_accounts_delete.ts
  api_shit_1170_tx_queue_sent_post.ts
  api_shit_1170_tx_queue_stats_contracts_get.ts
  api_shit_1170_tx_queue_stats_methods_get.ts
```

the request types for the queue routes take the batch:

```ts
export interface SHIT_1170_TX_QUEUE_REQUEST {
  what?: string;
  when?: string;
  why?: string;
  when_at?: number;
  transactions: SHIT_1170_TX_QUEUE_TRANSACTION_REQUEST[];
  accounts?: string[];
}
```

plus the types:

```
middleman/src/types/
  shit_1170_api_keys.ts        — the api key shapes
  shit_1170_tx_queue.ts        — the queue shapes
  shit_1170_tx_queue_query.ts  — the list filters
```

the queue types are the wire shapes:

```ts
// one account on one transaction — the WHO object
export interface SHIT_1170_TX_QUEUE_ACCOUNT {
  account_id: string;
  status: "pending" | "sent" | "succeeded" | "failed";
  tx_hash: string | null;
}

// one function call in the batch
export interface SHIT_1170_TX_QUEUE_TRANSACTION {
  tx_id: string;
  position: number;
  contract_id: string;
  method: string;
  args: Record<string, unknown>;
  gas: string | null;
  deposit: string | null;
  accounts: SHIT_1170_TX_QUEUE_ACCOUNT[];
}

// the whole batch
export interface SHIT_1170_TX_QUEUE {
  queue_id: string;
  what: string | null;
  when: string | null;
  why: string | null;
  when_at: number | null;
  transactions: SHIT_1170_TX_QUEUE_TRANSACTION[];
  accounts: SHIT_1170_TX_QUEUE_ACCOUNT[];
  created_at: number;
  updated_at: number;
}
```

the toolbox's `generic_contract_transaction_type` is the same shape as
`SHIT_1170_TX_QUEUE_TRANSACTION` minus the queue bookkeeping — so the
frontend can hand the transactions straight to
`generic_contract_call_wallet` without reshaping them.

and the endpoint paths:

```
middleman/src/stuff/endpoint_paths.ts   — the new paths
```

**the api key header.** the middleman's `build_headers` sends
`x-session-token` today. it becomes `x-api-key`, and the old header name
is sent alongside it during the beta so an agent built against the old
name keeps working. the `REQUEST_OPTIONS` field is renamed
`session_token` → `api_key`.

### the cli bins

the repo has one bin per route, and a bin is how a human (or an agent)
talks to the backend from a terminal. these get bins too:

```
middleman/bin/shit-1170/
  api_shit_1170_tx_queue_post.ts
  api_shit_1170_tx_queue_get.ts
  api_shit_1170_tx_queue_one_get.ts
  api_shit_1170_tx_queue_accounts_post.ts
  api_shit_1170_tx_queue_accounts_delete.ts
  api_shit_1170_tx_queue_sent_post.ts
  api_shit_1170_tx_queue_stats_contracts_get.ts
  api_shit_1170_tx_queue_stats_methods_get.ts
```

a bin for the queue is what an AGENT actually calls. this is the
tooling that makes the plan usable:

```sh
# queue ONE transaction
bun middleman/bin/shit-1170/api_shit_1170_tx_queue_post.ts \
  --api-key shit_1170_abc123... \
  --contract-id ref.finance.near \
  --method ft_swap \
  --args '{"receiver_id":"alice.near"}' \
  --what "swap 100 USDC for NEAR" \
  --why "you asked for it"

# queue a BATCH of two, in order, in one wallet popup
bun middleman/bin/shit-1170/api_shit_1170_tx_queue_post.ts \
  --api-key shit_1170_abc123... \
  --contract-id ref.finance.near \
  --method ft_swap \
  --args '{"receiver_id":"alice.near"}' \
  --contract-id ref.finance.near \
  --method ft_resolve_transfer \
  --args '{"receiver_id":"alice.near"}' \
  --what "swap 100 USDC for NEAR"

# the queue for one account
bun middleman/bin/shit-1170/api_shit_1170_tx_queue_get.ts \
  --api-key shit_1170_abc123... \
  --account-id alice.near \
  --status pending
```

**why the bin takes `--contract-id` over and over.** one flag per
transaction, in the order they are given. a bin that took a json file
would be tidier for a batch of five, and harder for the common case of
one. the flag repeats, and the order is the order.

---

## 7. THE BACKEND ROUTE FILES

```
src/backend/routes/
  app_router_fun.rs                    (updated — the new routes)
  ping_route.rs                        (keep)
  api_keys_route.rs                    NEW — was sessions_route.rs
  api_key_me_route.rs                  NEW — was session_me_route.rs
  api_key_rotate_route.rs              NEW — was session_rotate_route.rs
  tx_queue_route.rs                    NEW — POST + GET the list
  tx_queue_one_route.rs                NEW — GET one
  tx_queue_accounts_route.rs           NEW — POST add an account
  tx_queue_accounts_delete_route.rs    NEW — DELETE remove an account
  tx_queue_sent_route.rs               NEW — POST record the send
  tx_queue_stats_contracts_route.rs    NEW — the popular contracts
  tx_queue_stats_methods_route.rs      NEW — the popular methods
  trezu_treasuries_route.rs            (keep)
```

**why the routes are not one file.** the repo's rule is one function per
file, and each route file holds one route. eight routes, eight files.

and the request/response types:

```
src/backend/types/
  api_keys_request.rs                  NEW — was sessions_request.rs
  tx_queue_request.rs                  NEW — the queue bodies
  tx_queue_query.rs                    NEW — the list filters
```

the types hold the WIRE shapes — camelCase, matching the browser's
session object. the db rows are snake_case and stay in the store.

---

## 8. THE FRONTEND — NOT IN THIS PLAN

you said: *"for now just make sure backend logic and DB tables are clean."*

so this plan is **backend + middleman only**. the feed page's queue list,
the signing flow, the filter ui — all of that is a later plan, and it
gets its own `DOCS/PAGES/` spec when it happens.

**the one frontend thing that changes** is the api key wording, because
the header name changes and the routes are renamed. the frontend files
that touch it:

**the batch does not touch the frontend at all.** the feed page has no
queue list yet, so there is nothing to render a batch of transactions
in. when the feed page is built, it renders the batch's transactions in
`position` order — that is the whole change, and it is a later plan.

```
frontend/lib/ts/shared/session.ts         → api_key.ts (renamed)
frontend/lib/ts/shared/session_token.ts   → api_key_token.ts (renamed)
frontend/lib/ts/shared/auth_sessions.ts   → keeps its name (it holds the
                                            SIGNED MESSAGES, not the key)
frontend/lib/ts/skill/...                 → the skill page's key card
frontend/lib/components/app-wide/auth_button.tsx  → reads the account
```

**why the frontend rename is in this plan at all.** the middleman
renames the header to `x-api-key` and the routes to `/api-keys`, so the
frontend has to follow or it breaks. the alternative — leaving the
frontend on the old names and the middleman sending both headers — is
more churn and leaves the codebase saying two different things about the
same thing.

**what is NOT touched in the frontend:** no new page, no new component,
no css, no new mount id. the feed page still says COMING SOON.

---

## 9. THE DOCS

```
DOCS/ROUTES.md                          (updated — the new routes)
DOCS/ROUTES/README.md                   (updated — the new route files)
DOCS/ROUTES/shit-1170-api-keys.md       NEW
DOCS/ROUTES/shit-1170-api-key-me.md     NEW
DOCS/ROUTES/shit-1170-api-key-rotate.md NEW
DOCS/ROUTES/shit-1170-tx-queue.md       NEW
DOCS/ROUTES/shit-1170-tx-queue-accounts.md  NEW
DOCS/ROUTES/shit-1170-tx-queue-sent.md NEW
DOCS/ROUTES/shit-1170-tx-queue-stats.md NEW
DOCS/VAULT.md                           (updated — the three tables)
DOCS/PAGES/README.md                    (unchanged — no new page)
```

the old route files are deleted:

```
DOCS/ROUTES/shit-1170-sessions.md
DOCS/ROUTES/shit-1170-session-me.md
DOCS/ROUTES/shit-1170-session-rotate.md
```

**note on the rule about tables in markdown.** `DOCS/RULES.md` says
*"never put a table in a markdown file. prefer to create .csv files
instead."* so the schema and the route lists go in `.csv` files:

```
DOCS/DB/tables.csv     — the three tables, one row per column
DOCS/DB/indexes.csv    — the indexes
DOCS/DB/routes.csv     — the route list
```

and the markdown files hold the prose — what the route does, why, the
shape of the body — with the csvs holding the field lists.

---

## 10. THE ORDER OF THE WORK

each step leaves the app working.

1. **the db layer** — the three table files, `db_schema_run_fun.rs`, the
   `db_schema.rs` deletion, the `mod.rs` update
2. **the api key rename** — the table rename, the store rename, the
   routes, the middleman, the frontend wording
3. **the queue db** — `tx_queue_store.rs`, `tx_queue_accounts_store.rs`
4. **the queue routes** — the six route files and the types
5. **the middleman** — the eleven client functions and the types
6. **the bins** — the eight cli bins
7. **the docs** — the route files, the db csvs, `ROUTES.md`, `VAULT.md`
8. **the tests** — the store tests, the route tests

**why the rename comes before the queue.** the rename touches the
sessions table, the session routes and the middleman's header builder —
all of which the queue routes also touch. doing the rename first means
the queue is built once, on the new wording, with no second pass to
fix the old one.

---

## 11. THE TESTS

the repo has real tests against a real sqlite file
(`sessions_store_test.rs`), and the queue gets the same.

**the store tests** (`tx_queue_store_test.rs`,
`tx_queue_transactions_store_test.rs`,
`tx_queue_accounts_store_test.rs`)

- a queued batch is stored and read back
- the transactions of a batch come back in `position` order
- the args json round-trips
- the WHO rows of a batch are read back
- adding the same account twice is refused
- removing an account removes its rows under every transaction
- a row with a hash is not removed — it is history
- the stats count is right
- the schema is created and the db opens again

**the route tests** (`tx_queue_route_test.rs`)

- queueing without an api key is refused
- queueing with a bad key is refused
- adding an account with a key that is not that account's is refused
- adding an account with the right key works
- the send route sets the status and the hash
- the send route refuses a key that is not the account's
- a batch of three transactions is queued and read back whole
- the sent route sets the hash on the right transaction only
- more than 50 transactions is refused
- a named account the agent holds no key for is refused — the NAMING rule
- a named account the agent DOES hold a key for is accepted
- an account signing a queue it was not named on joins the WHO list
- adding an account with another account's key is refused
- the sent route writes the outcome when one is given

**the existing tests move with the rename:**

```
session_key_prefix_test.rs  → api_key_prefix_test.rs
sessions_store_test.rs       → api_keys_store_test.rs
```

---

## 12. THE THINGS I AM NOT DOING, AND WHY

| not doing | why |
|---|---|
| the feed page ui | you said backend and db first |
| the signing flow | the queue records the hash — the app that signs it is the ui's job |
| transfers in the queue | only function calls. a transfer is not a function call and the toolbox type is a function call |
| one queued tx with two actions | the toolbox type has one action per transaction. two actions are two TRANSACTIONS in one batch, which is the same thing with a different name |
| a queue expiry / ttl | not asked for. a queued tx waits until it is signed or removed |
| a soft delete on the queue | a hard delete cascades to the account rows. it is a beta |
| rate limiting the queue | the api key is the gate. a rate limiter is a later thing |
| editing a queued transaction | a queued batch is immutable once queued. a change means a new batch |
| a "is the queue done" status | a queue is never done — anyone can always join and send it. the status is per account and per transaction, and that is all there is |
| the agent naming accounts it has no key for | the WHO list is the agent's own users. naming somebody else would be the agent putting a tx in somebody's feed without them asking |
| removing one transaction from a batch | the positions would renumber and the wallet would get a different set. a batch is all or nothing |
| the agent's own identity | one api key, one agent. which agent queued what is not tracked |
| deleting a sent row | a row with a hash is history. it shows who did the tx, and it stays |
| the backend checking the chain | the frontend reads the outcome from fastnear, as the swap page already does, and reports it back. the backend stores what it is told |

---

## 13. THE DECISIONS THAT WERE MADE

these came out of the question box, and they are baked into the plan
above. they are listed here so a reader can see what was chosen and
why, without scrolling back.

| decision | what was chosen |
|---|---|
| the session key's name | **api key**. the header is `x-api-key`. the old `x-session-token` still works |
| the agent's credential | the same key. the user signs in once and hands that key to the agent |
| the WHO's shape | one row per account, with `account_id`, `status` and `tx_hash` — exactly the three fields you named |
| the WHO is a table, not json | so "the txs for this account" is an indexed read and the hash is a column |
| transactions per queue | many. one `queue_id` holds a batch, sent in one wallet popup |
| every account signs every tx | yes — one popup per account, covering the whole batch |
| the order of the batch | it matters. the `position` column holds it |
| the batch size cap | 50 |
| the status | four states on the account row: `pending`, `sent`, `succeeded`, `failed` |
| a queue-level status | **none**. a queue is never done — anyone can always join and send it |
| a transaction-level status | **none**. the truth is the account rows |
| who is on a queue | the accounts the agent named (status `pending`) AND the accounts that sent it (status `sent`/`succeeded`/`failed`) |
| **who the agent may NAME** | **only accounts whose api key it holds.** it cannot name a stranger's account, so it cannot put a tx in another agent's user's feed |
| who may SIGN | any signed-in user, on any queue they can see. the queue is an open offer |
| signing a queue you were not named on | allowed. the account row is created and it joins the WHO list |
| adding an account | the route stays, but it only ever adds **your own** account |
| removing an account | your own account, and only while it has no hash. a sent row is history |
| reporting a send | one call for the whole batch, with `txId` + `txHash` + optional `status` per entry |
| recording success/failure | the frontend reads the outcome from the chain and reports it back. the backend stores it |
| the list | open to anyone with an api key. no `status` filter, only `account_id` |
| `when` | free text, plus a nullable `when_at` epoch ms for the machine-readable case |
| the deploy | **not this session**. build and test locally only |

---

## 14. THE FILE LIST — EVERY FILE TOUCHED

### new — backend db

```
src/backend/logic/db/db_schema_run_fun.rs
src/backend/logic/db/db_table_api_keys_fun.rs
src/backend/logic/db/db_table_tx_queue_fun.rs
src/backend/logic/db/db_table_tx_queue_transactions_fun.rs
src/backend/logic/db/db_table_tx_queue_accounts_fun.rs
```

### new — backend logic

```
src/backend/logic/endpoint_shit_1170_api_keys/mod.rs
src/backend/logic/endpoint_shit_1170_api_keys/api_key_fun.rs
src/backend/logic/endpoint_shit_1170_api_keys/api_key_of_header_fun.rs
src/backend/logic/endpoint_shit_1170_api_keys/api_key_account_fun.rs
src/backend/logic/endpoint_shit_1170_api_keys/api_keys_store.rs
src/backend/logic/endpoint_shit_1170_api_keys/api_keys_store_test.rs
src/backend/logic/endpoint_shit_1170_tx_queue/mod.rs
src/backend/logic/endpoint_shit_1170_tx_queue/tx_queue_store.rs
src/backend/logic/endpoint_shit_1170_tx_queue/tx_queue_transactions_store.rs
src/backend/logic/endpoint_shit_1170_tx_queue/tx_queue_accounts_store.rs
src/backend/logic/endpoint_shit_1170_tx_queue/tx_queue_args_fun.rs
src/backend/logic/endpoint_shit_1170_tx_queue/tx_queue_row_to_json_fun.rs
src/backend/logic/endpoint_shit_1170_tx_queue/tx_queue_auth_fun.rs
src/backend/logic/endpoint_shit_1170_tx_queue/tx_queue_named_accounts_fun.rs
src/backend/logic/endpoint_shit_1170_tx_queue/tx_queue_uuid_fun.rs
src/backend/logic/endpoint_shit_1170_tx_queue/tx_queue_store_test.rs
```

### new — backend routes and types

```
src/backend/routes/api_keys_route.rs
src/backend/routes/api_key_me_route.rs
src/backend/routes/api_key_rotate_route.rs
src/backend/routes/tx_queue_route.rs
src/backend/routes/tx_queue_one_route.rs
src/backend/routes/tx_queue_accounts_route.rs
src/backend/routes/tx_queue_accounts_delete_route.rs
src/backend/routes/tx_queue_sent_route.rs
src/backend/routes/tx_queue_stats_contracts_route.rs
src/backend/routes/tx_queue_stats_methods_route.rs
src/backend/routes/tx_queue_route_test.rs
src/backend/types/api_keys_request.rs
src/backend/types/tx_queue_request.rs
src/backend/types/tx_queue_query.rs
```

### deleted — backend

```
src/backend/logic/db/db_schema.rs
src/backend/logic/endpoint_shit_1170_sessions/   (the whole folder)
src/backend/routes/sessions_route.rs
src/backend/routes/session_me_route.rs
src/backend/routes/session_rotate_route.rs
src/backend/routes/session_key_prefix_test.rs
src/backend/types/sessions_request.rs
```

### changed — backend

```
src/lib.rs                        — the module list
src/backend/logic/db/mod.rs        — the module list
src/backend/routes/app_router_fun.rs — the routes
```

### new — middleman

```
middleman/src/fun/api_shit_1170_api_keys_post.ts
middleman/src/fun/api_shit_1170_api_key_me_get.ts
middleman/src/fun/api_shit_1170_api_key_rotate_post.ts
middleman/src/fun/api_shit_1170_tx_queue_post.ts
middleman/src/fun/api_shit_1170_tx_queue_get.ts
middleman/src/fun/api_shit_1170_tx_queue_one_get.ts
middleman/src/fun/api_shit_1170_tx_queue_accounts_post.ts
middleman/src/fun/api_shit_1170_tx_queue_accounts_delete.ts
middleman/src/fun/api_shit_1170_tx_queue_sent_post.ts
middleman/src/fun/api_shit_1170_tx_queue_stats_contracts_get.ts
middleman/src/fun/api_shit_1170_tx_queue_stats_methods_get.ts
middleman/src/types/shit_1170_api_keys.ts
middleman/src/types/shit_1170_tx_queue.ts
middleman/src/stuff/endpoint_paths.ts     (changed)
middleman/src/stuff/request_options.ts   (changed — the header)
middleman/src/index.ts                    (changed — the exports)
middleman/bin/shit-1170/api_shit_1170_tx_queue_post.ts
middleman/bin/shit-1170/api_shit_1170_tx_queue_get.ts
middleman/bin/shit-1170/api_shit_1170_tx_queue_one_get.ts
middleman/bin/shit-1170/api_shit_1170_tx_queue_accounts_post.ts
middleman/bin/shit-1170/api_shit_1170_tx_queue_accounts_delete.ts
middleman/bin/shit-1170/api_shit_1170_tx_queue_sent_post.ts
middleman/bin/shit-1170/api_shit_1170_tx_queue_stats_contracts_get.ts
middleman/bin/shit-1170/api_shit_1170_tx_queue_stats_methods_get.ts
middleman/bin/shit-1170/README.md         (changed)
```

### deleted — middleman

```
middleman/src/fun/api_shit_1170_sessions_post.ts
middleman/src/fun/api_shit_1170_session_me_get.ts
middleman/src/fun/api_shit_1170_session_rotate_post.ts
middleman/src/types/shit_1170_sessions.ts
```

### changed — frontend (the rename only)

```
frontend/lib/ts/shared/session.ts        → renamed api_key.ts
frontend/lib/ts/shared/session_token.ts  → renamed api_key_token.ts
frontend/lib/ts/skill/app_page_skill_session_store.ts
frontend/lib/ts/skill/app_page_skill_session_rotate.ts
frontend/lib/ts/skill/app_page_skill_start.ts
frontend/lib/components/skill/app_page_skill_session.tsx
frontend/lib/ts/shared/auth_sessions.ts   (the signed messages — the name stays)
```

### new — docs

```
DOCS/DB/tables.csv
DOCS/DB/indexes.csv
DOCS/DB/routes.csv
DOCS/ROUTES/shit-1170-api-keys.md
DOCS/ROUTES/shit-1170-api-key-me.md
DOCS/ROUTES/shit-1170-api-key-rotate.md
DOCS/ROUTES/shit-1170-tx-queue.md
DOCS/ROUTES/shit-1170-tx-queue-accounts.md
DOCS/ROUTES/shit-1170-tx-queue-sent.md
DOCS/ROUTES/shit-1170-tx-queue-stats.md
```

### changed — docs

```
DOCS/ROUTES.md
DOCS/ROUTES/README.md
DOCS/VAULT.md
```

### deleted — docs

```
DOCS/ROUTES/shit-1170-sessions.md
DOCS/ROUTES/shit-1170-session-me.md
DOCS/ROUTES/shit-1170-session-rotate.md
```

---

## 15. THE BUILD AND THE TESTING

**this session does not deploy.** nothing goes to
`https://shit-1170.com/`. the container is not rebuilt against the live
site, and the live site's db is not touched.

### the local db is wiped

the local db file is deleted and rebuilt:

```
${HOME}/.shit-1170-rex-engine/shit-1170-rex-engine.db
```

or wherever `SHIT_1170_VAULT_DB_LOCATION` points it. the old `sessions`
table goes, `api_keys` takes its place, and the two new queue tables
appear.

**the local keys go with it.** every api key a local agent holds stops
working, and the local user signs in again to get a new one. that is the
cost of the rename, and the data had no value yet.

### how it is run and tested

- `cargo test` — the store tests and the route tests, against a real
  sqlite temp file
- `cargo run` — the backend on `127.0.0.1:54733`
- the **bins** against the running local backend — the queue is created,
  an account is added, it is sent, and it is read back, all from the
  command line against the local server

### the local check list

1. sign in — `POST /api/shit-1170/api-keys` with a signed message
2. `GET /api/shit-1170/api-key/me` — the key belongs to the account
3. queue a batch of two transactions — `POST /api/shit-1170/tx-queue`
4. read it back — `GET /api/shit-1170/tx-queue/{queue_id}` — two
   transactions, in order, one account
5. add a second account — `POST .../accounts` — with the second
   account's own key
6. try to add an account with the WRONG key — `403`
7. record a send — `POST .../sent` — the hash lands on the right
   transaction and the account
8. the queue's status becomes `sent` when every account row is `sent`
9. the stats — `GET .../stats/contracts` and `.../stats/methods`
10. the old `x-session-token` header still works

### the deploy is a later session

when it happens, the live db is wiped the same way, the container is
rebuilt, and the live check is the list above against the live site.

========================================
<br/>
copyright 2026 by sleet.near
