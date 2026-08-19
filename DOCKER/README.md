# ====================================
# huggies-rex-engine DOCKER
# build, run, and inspect the huggies-rex engine container.
# ====================================
build:
```sh
docker build -f DOCKER/Dockerfile -t huggies-rex-engine .
```

run (foreground):
```sh
docker run --rm -p 48080:48080 \
  -v "${HOME}/.huggies-rex-vault:/home/huggies-rex/.huggies-rex-vault" \
  huggies-rex-engine
```

or via compose:
```sh
docker compose -f DOCKER/docker-compose.yml up -d --build
docker compose -f DOCKER/docker-compose.yml logs -f
docker compose -f DOCKER/docker-compose.yml down
```

the vault (sqlite cache + watchlist.json + follows.json + trades.json)
lives on the host under `${HOME}/.huggies-rex-vault` and is mounted in.

bind address defaults to `0.0.0.0:48080` (override via
`HUGGIES_REX_BIND_ADDR`).
# ====================================
# copyright 2026 by sleet.near
