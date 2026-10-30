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

first time only, put your tunnel token in a `.env` at the repo root
(see `.env.example`):

```sh
cp .env.example .env
# then edit .env and set TUNNEL_TOKEN to the token from the cloudflare dashboard
chmod 600 .env
```

then:

```sh
docker compose -f DOCKER/docker-compose.yml up -d --build
docker compose -f DOCKER/docker-compose.yml logs -f
docker compose -f DOCKER/docker-compose.yml down
```

## access

the app is served through a cloudflare tunnel and is **not published to
the host** — nothing binds 54733 on your machine. open the `https://`
hostname you set up in the cloudflare dashboard.

two cloudflare-side things have to match:

1. the tunnel's **service URL** for the published route must be
   `http://huggies-rex-engine-fullstack-backend:54733` — the container
   name, not `localhost`. cloudflared runs as its own container, so
   `localhost` there is a different machine.
2. the token in `.env` is the one from the tunnel's docker install
   command (`--token ...`), set as `TUNNEL_TOKEN`. that exact name
   matters — cloudflared reads it from the environment itself, and
   `docker-compose.yml` passes `.env` straight through.

to debug over plain http instead, uncomment the `ports:` block on the
`huggies-backend` service in `docker-compose.yml`, then open
`http://localhost:54733` (sign-in works there because localhost is a
secure context).

## notes

- the frontend is baked into the image at `/app/static` — no host volume
  is needed for it, and there is no vault or database yet, so nothing is
  mounted.
- the binary binds `0.0.0.0:54733` inside the container so cloudflared can
  reach it over the compose network by container name. no host port is
  published.
- **wallet sign-in needs a secure context.** over plain http only
  `localhost` and `127.0.0.1` are secure, so `http://localhost:54733`
  signs in and every other http address fails with
  `"Cannot read properties of undefined (reading 'generateKey')"`. the
  reason is that signing the login message uses WebCrypto Ed25519, and
  `crypto.subtle` only exists in a secure context. the cloudflare tunnel
  is what fixes this: it terminates TLS at the edge, so the `https://`
  hostname is a secure context from any device.
- rebuild after changing `frontend/` — `docker compose ... up -d --build`
  recompiles the bun bundle. if it's already running, `--build` is enough;
  no need to `down` first.

========================================
<br/>
copyright 2026 by sleet.near
