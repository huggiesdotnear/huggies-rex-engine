# VAULT

the backend db storage location will be hardcoded to this location for simplicity.

LOCATION: `${HOME}/.huggies-rex-engine/huggies-rex-engine.db`

that will be the default location that we use to store the sqlite db file.

can be overridden with a an `HUGGIES_VAULT_DB_LOCATION` env but the defualt is not to use that env or set that.

we will mount this location in docker.

NEVER wipe or delete this db.

## WHAT IS IN IT

the db holds ONE table for now: `sessions`.

- `user_id` - the NEAR account id of the user. it is the PRIMARY KEY,
  because a user has exactly one session, ever.
- `session_key` - the session key, ENCRYPTED. the plain key is never in
  the db.
- `session_key_hash` - the sha-256 of the key. a request is looked up
  by this, so no row has to be decrypted to find the match.
- `accounts` - the accounts the user holds signed in, as a json array.
- `created_at` / `updated_at` - millisecond timestamps.

the schema is written by the migrations in
`src/backend/logic/db_migrations.rs`. each migration runs once, inside a
transaction, and the db remembers which ones ran.

## THE SESSION SECRET

the session keys are encrypted with a secret that comes from the
environment: `HUGGIES_SESSION_SECRET`.

it is NOT in the db and NOT in the image — it lives in the repo-root
`.env` (see `.env.example`) and goes into the container as an env var.

> changing it makes every existing session key unreadable. the db holds
> the keys encrypted with it, so a new secret locks every signed-in
> user out until they sign in again.

make one with `openssl rand -hex 32`.

## IN DOCKER

the db lives in the named volume `huggies-vault`, mounted at
`/home/huggies/.huggies-rex-engine` — the app's default path inside the
image, since `HOME` is `/home/huggies` there.

`docker compose down` keeps the volume. `docker compose down -v`
DELETES it, and with it every session key.

=====================
<br/>
copyright 2026 by sleet.near
