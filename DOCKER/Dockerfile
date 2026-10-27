# ========================================
# huggies-rex-engine — Dockerfile
# requires BuildKit for --mount=type=cache.
#
# two stages:
#   frontend     — bun build compiles `frontend/` (HTML + TS) into `static/`
#   rust-builder — rust:slim-bookworm, builds the release binary with cached
#                  cargo/registry + cargo/git mounts
#
# final image is debian:bookworm-slim so the binary's libc matches the one
# it was linked against.
#
# NOTE: no vault / no persistent state here yet. the backend keeps nothing
# on disk — `static/` is baked into the image and the frontend calls the
# intear api directly from the browser. when postgres lands, add a service
# to `docker-compose.yml` and a DATABASE_URL env var here.
# ========================================
# syntax=docker/dockerfile:1.7

# ========================================
# Stage 1: frontend bundle (bun).
# ========================================
FROM oven/bun:alpine AS frontend

WORKDIR /src

# copy the package manifest + lockfile FIRST so node_modules is
# cached independently of source-only edits.
COPY package.json bun.lock ./
COPY tsconfig.json ./
COPY middleman ./middleman
COPY frontend ./frontend

# install only what's needed for the frontend build. the middleman/
# and frontend trees import `preact` indirectly (components that call
# useState / h) so we need it on disk for bun to resolve.
# `--frozen-lockfile` is too strict across bun minor versions since
# the lockfile format can shift; package.json is tiny so a free-form
# install is fine.
RUN bun install

# produce minified static files at /src/static, preserving the
# `app/` subdirectory so the nested pages keep their depth.
#
# --- WHY: no --public-path here (unlike the graupelos Dockerfile) ---
# the pages reference their assets RELATIVELY (`./favicon.svg` from
# /index.html, `../favicon.svg` from /app/index.html). bun rewrites
# those to match each page's depth. forcing `--public-path=/` would
# rewrite every reference to an absolute /name.ext, which the
# ServeDir can still resolve, but it breaks the relative layout this
# repo depends on — so leave the default.
#
# the asset naming templates embed `[hash]` so two pages sharing the
# same CSS path don't collide on disk.
#
# --- WHY: `[dir]` in the chunk and asset naming ---
# without it, every page's css and js lands flat in static/. the root
# index.html and app/index.html then both produce a file called
# `index-<hash>.css` — and when their content happens to be identical
# (which it is for pages that share the same css), the hash matches
# too and bun refuses to build: "Multiple files share the same output
# path". keeping the directory puts each page's assets beside it, so
# two pages can never collide no matter what their content is.
#
# `find` instead of a `./**/*.html` glob: globstar is not enabled in
# the default sh that runs this, so the glob would silently match
# nothing and we'd ship an empty static folder. `find` also picks up
# the nested pages under app/contract/ and app/tokens/.
#
# --- WHY: build from INSIDE frontend/ ---
# bun derives the entry path from the current working directory, so
# building here makes `frontend/app/account.html` land at
# `static/app/account.html` — the same layout the local build in the
# README produces (`cd frontend && bun build ./**/*.html --outdir=../static`).
# building from the repo root instead would add a `frontend/` prefix to
# every path and serve the app under /frontend/app/... instead of /app/...
WORKDIR /src/frontend
RUN mkdir -p ../static \
    && bun build \
        --entry-naming='[dir]/[name].[ext]' \
        --chunk-naming='[dir]/[name]-[hash].[ext]' \
        --asset-naming='[dir]/[name]-[hash].[ext]' \
        --outdir=../static \
        --minify \
        $(find . -type f -name '*.html')

# ========================================
# Stage 2: rust builder.
# ========================================
FROM rust:slim-bookworm AS rust-builder

WORKDIR /build

# the backend is plain axum — no near-kit, no aws-lc-sys — so the
# only system dep needed is a linker plus pkg-config for openssl-sys
# via rustls backends.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# layer the dependency manifest first so source-only edits skip the
# dependency build. /build/target lives on the layer filesystem (not a
# cache mount) so the final binary is visible to the next stage's COPY.
COPY Cargo.toml Cargo.lock ./
RUN --mount=type=cache,target=/usr/local/cargo/registry,sharing=locked \
    --mount=type=cache,target=/usr/local/cargo/git,sharing=locked \
    mkdir -p src \
    && echo "fn main() {}" > src/main.rs \
    && cargo build --release \
    && rm -rf src target/release/deps/huggies_rex_engine* target/release/huggies-rex-engine

# real build. NOTE: no `static/` copy here — `static/` is gitignored and
# never exists in the build context, and the binary doesn't read it at
# compile time (ServeDir opens it at runtime). the frontend bundle is
# copied from the frontend stage straight into the runtime stage below.
COPY src ./src
RUN --mount=type=cache,target=/usr/local/cargo/registry,sharing=locked \
    --mount=type=cache,target=/usr/local/cargo/git,sharing=locked \
    touch src/main.rs \
    && cargo build --release

# ========================================
# Stage 3: minimal runtime image.
# debian:bookworm-slim matches the libc the rust builder linked against.
# ========================================
FROM debian:bookworm-slim

# ca-certificates for talking to public NEAR RPC / intear api over HTTPS.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 1000 --home /home/huggies \
        --shell /usr/sbin/nologin huggies

COPY --from=rust-builder /build/target/release/huggies-rex-engine /usr/local/bin/huggies-backend
COPY --from=frontend /src/static /app/static

# --- WHY: ServeDir::new("static") is a RELATIVE path ---
# app_router_fun serves the static folder with a relative path, so the
# process cwd decides where `static/` is looked up. it must be /app.
WORKDIR /app

# defaults baked into the binary: 0.0.0.0:54733. 0.0.0.0 is required
# inside a container — binding localhost inside the container would
# make the published port unreachable from the host.
ENV HUGGIES_HOST=0.0.0.0
ENV HUGGIES_PORT=54733
ENV RUST_LOG=huggies_rex_engine=info
EXPOSE 54733

USER huggies
ENTRYPOINT ["/usr/local/bin/huggies-backend"]
# ========================================