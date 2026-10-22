# docker

all commands below are run from the project root.

## build image

```sh
docker build -t huggies-rex-engine -f DOCKER/Dockerfile .
```

## run container

```sh
docker run --rm -it \
  --name huggies-backend \
  -p 54733:54733 \
  -e HUGGIES_HOST=0.0.0.0 \
  -e HUGGIES_PORT=54733 \
  huggies-rex-engine
```

## docker compose

```sh
docker compose -f DOCKER/docker-compose.yml up -d --build
docker compose -f DOCKER/docker-compose.yml logs -f
docker compose -f DOCKER/docker-compose.yml down
```

## notes

- the frontend is baked into the image at `/app/static` — no host volume
  is needed for it, and there is no vault or database yet, so nothing is
  mounted.
- the binary binds `0.0.0.0:54733` inside the container and the compose
  mapping is `54733:54733`, so the service is reachable from the host.
- **wallet sign-in needs a secure context.** open
  `http://localhost:54733`. browsers only treat `https`,
  `http://localhost` and `http://127.0.0.1` as secure, so any LAN or
  public http address fails sign-in with
  `"Cannot read properties of undefined (reading 'generateKey')"`. to
  reach it from another machine, front it with an https reverse proxy.
- rebuild after changing `frontend/` — `docker compose ... up -d --build`
  recompiles the bun bundle. if it's already running, `--build` is enough;
  no need to `down` first.

## future: postgres

there is no postgres service yet. when the backend starts persisting
rows, add a `postgres:` service + volume to `docker-compose.yml` (a
commented-out template is already in that file), add
`depends_on: [postgres]` and a `DATABASE_URL` env var to the backend
service, and add the `sqlx`/`tokio-postgres` dependency in `Cargo.toml`.
the image needs no change for this beyond carrying the env var.

========================================
<br/>
copyright 2026 by sleet.near