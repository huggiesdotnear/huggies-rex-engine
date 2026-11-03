# VAULT

the backend db storage location will be hardcoded to this location for simplicity.

LOCATION: `${HOME}/.huggies-rex-engine/huggies-rex-engine.db`

that will be the default location that we use to store the sqlite db file.

can be overridden with a an `HUGGIES_VAULT_DB_LOCATION` env but the defualt is not to use that env or set that.

we will mount this location in docker.

NEVER wipe or delete this db.

## WHAT IS IN IT

the db holds ONE table for now: `sessions`.

- `account_id` - the NEAR account id. it is the PRIMARY KEY, because an
  account has exactly one session key, ever.
- `session_key` - the session key. it is stored as it is: the key is
  ours and the db is ours, and the key guards nothing that acts as the
  user yet.
- `session_key_hash` - the sha-256 of the key. a request is looked up
  by this, so the read path never has to compare against every row's
  key.
- `created_at` / `updated_at` - millisecond timestamps.

## THE SCHEMA

the schema lives in `src/backend/logic/db_schema.rs`, as one statement
that creates the tables if they are not there yet.

**there is no migration system.** a migration system exists so a db's
schema can be CHANGED over time: each change is a numbered step, the db
records which steps it has run, and a fresh db runs them all in order.
this db has one table and one shape for it, so there is nothing to step
through and nothing to remember.

a changed shape means changing `db_schema.rs` and starting the db over.
the db is ours and it holds nothing that cannot be made again.

## IN DOCKER

the db lives in the named volume `huggies-vault`, mounted at
`/home/huggies/.huggies-rex-engine` — the app's default path inside the
image, since `HOME` is `/home/huggies` there.

`docker compose down` keeps the volume. `docker compose down -v`
DELETES it, and with it every session key.

=====================
<br/>
copyright 2026 by sleet.near
