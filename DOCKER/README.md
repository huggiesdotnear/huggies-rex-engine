# docker

all commands below are run from the project root.

## build image

```sh
docker build -t huggies-rex-engine -f DOCKER/Dockerfile .
```

## run container

```sh
docker run --rm -it \
  --name huggies-rex-engine-fullstack-backend \
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
  `http://localhost:54733` and sign-in works. browsers only treat
  `https`, `http://localhost` and `http://127.0.0.1` as secure, so the
  same container reached over any LAN or VPN address on plain http
  (a private ip, a vpn ip, a public hostname) fails sign-in with
  `"Cannot read properties of undefined (reading 'generateKey')"`.
  the reason is that signing the login message uses WebCrypto
  Ed25519, and `crypto.subtle` only exists in a secure context —
  there is no port or firewall change that gets around it. to use
  the app from another device, terminate TLS in front of this
  container on the hostname you open it from, and use the `https://`
  url.
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