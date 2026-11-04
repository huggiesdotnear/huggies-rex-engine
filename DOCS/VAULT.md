# VAULT

the backend db storage location will be hardcoded to this location for simplicity.

LOCATION: `${HOME}/.shit-1170-rex-engine/shit-1170-rex-engine.db`

that will be the default location that we use to store the sqlite db file.

can be overridden with a an `SHIT_1170_VAULT_DB_LOCATION` env but the defualt is not to use that env or set that.

we will mount this location in docker.

NEVER wipe or delete this db.

## WHAT IS IN IT

the db holds FOUR tables of its own:

- `api_keys` — the api keys the users hold. one row per ACCOUNT, and an
  account has exactly one key, ever.
- `tx_queue` — one row per queued BATCH of transactions. it holds the
  WHAT, the WHEN, the WHY and the WHEN_AT of the batch.
- `tx_queue_transactions` — one row per transaction inside a batch. it
  holds the HOW: the contract, the method, the args, the gas and the
  deposit, and the `position` that says the order.
- `tx_queue_accounts` — one row per account, per transaction. this is
  the WHO of a batch, and it is the ONLY place a status lives.

the tables were once ONE table called `sessions`, and the api keys were
called session keys. the credential in them is not a browser session: the
user signs in once and hands the key to an agent, and the agent holds it
as a bearer token for as long as it lives. a "session" describes the
browser's short use of it; an "api key" describes what it actually is.

the column-by-column shape of every table is in
[`DB/tables.csv`](./DB/tables.csv), and the indexes are in
[`DB/indexes.csv`](./DB/indexes.csv). the markdown holds the prose and
the csvs hold the field lists.

## THE THREE LEVELS OF A QUEUE

a queued batch is three levels deep:

```
a QUEUE  (queue_id)          what / when / why
  └── a TRANSACTION          contract_id / method / args / gas / deposit
        └── an ACCOUNT ROW    account_id / status / tx_hash
```

a queue is a BATCH, not one transaction. the agent queues a swap, and
that swap needs three function calls — a deposit, the swap itself, and a
withdrawal — so they go in together under one `queue_id`, and the user
signs them as one batch, in one wallet popup.

## WHERE THE STATUS LIVES

the status lives on the account row and NOWHERE ELSE. there is no
status column on `tx_queue` and no status column on
`tx_queue_transactions`.

it is the one place where the truth is. a transaction is not "sent" or
"failed" on its own — it is sent BY an account, and each account's send
is its own transaction with its own hash and its own outcome. two
accounts sending the same queued transaction produce two different
on-chain transactions, and either can succeed while the other fails.

and there is no queue-level status because **a queue is never done**. at
any moment another account can decide they want to send it, and they
join. a "is this queue done" badge would be a lie the moment somebody
new signs it.

the four states are `pending`, `sent`, `succeeded` and `failed`.

## THE ACCOUNTS TABLE IS THE JOIN

the account row hangs off the TRANSACTION and not off the QUEUE. a queue
has three transactions, the user signs all three together, and EACH
transaction produces its OWN hash. the hash cannot live on the account
row of the queue, or three hashes would collide in one column.

the account row's primary key is `(tx_id, account_id)` — the row is
about one transaction. the `queue_id` is kept as a column anyway, so a
query for "every account on this queue" is one indexed read with no join
through the transactions table.

## THE API KEYS TABLE

one row per ACCOUNT and not per person. an account has exactly one api
key, so the account id IS the row's identity — there is no linking
between accounts and no list to keep in agreement.

the key is stored as it is, and its sha-256 is stored next to it. a
request is looked up by the hash, so the read path never compares
against every row's key.

the `api_key_hash` index is UNIQUE. every authenticated request looks a
key up by its hash, and two rows with the same hash would mean two
accounts behind one credential. the uniqueness is the security property,
and the index is what makes the lookup cheap.

## THE SCHEMA

the schema lives in `src/backend/logic/db/`, one file per table, and
`db_schema_run_fun.rs` runs them all in order in one transaction.

**there is no migration system.** a migration system exists so a db's
schema can be CHANGED over time: each change is a numbered step, the db
records which steps it has run, and a fresh db runs them all in order.
this db has four tables and four settled shapes for them, so there is
nothing to step through and nothing to remember.

a changed shape means changing the table file. the db is ours and it
holds nothing that cannot be made again.

the tables are created in DEPENDENCY ORDER: `tx_queue` before
`tx_queue_transactions` before `tx_queue_accounts`.

## IN DOCKER

the db lives in the named volume `shit-1170-vault`, mounted at
`/home/shit-1170/.shit-1170-rex-engine` — the app's default path inside the
image, since `HOME` is `/home/shit-1170` there.

the volume is declared in `docker-compose.yml` with an explicit `name:`,
so it resolves to ONE fixed name on the host no matter what the compose
project is called. the host name it points at is
`huggies-rex-engine-fullstack-backend_huggies-vault` — the volume the
live deployment has been writing to since before the rename. the pin is
what keeps every session key alive across a rename of the project, the
service or the app.

`docker compose down` keeps the volume. `docker compose down -v`
DELETES it, and with it every api key and every queued batch.

=====================
<br/>
copyright 2026 by sleet.near
