# ====================================
FROM rust:1.88-bookworm AS builder
# ====================================
WORKDIR /build

COPY Cargo.toml Cargo.lock ./
RUN mkdir -p src \
    && echo "fn main() {}" > src/main.rs \
    && echo "" > src/lib.rs \
    && cargo build --release \
    && rm -rf src

COPY src ./src
COPY templates ./templates
COPY static ./static
RUN touch src/main.rs src/lib.rs \
    && cargo build --release

# ====================================
FROM debian:bookworm-slim
# ====================================
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 huggies-rex
WORKDIR /app

COPY --from=builder /build/target/release/huggies-rex-engine /app/huggies-rex-engine
COPY --chown=huggies-rex:huggies-rex templates ./templates
COPY --chown=huggies-rex:huggies-rex static ./static
COPY DOCKER/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN mkdir -p /home/huggies-rex/.huggies-rex-vault \
    && chown -R huggies-rex:huggies-rex /home/huggies-rex

ENV HOME=/home/huggies-rex
ENV HUGGIES_REX_BIND_ADDR=0.0.0.0:48080
EXPOSE 48080

ENTRYPOINT ["/entrypoint.sh"]
# ====================================
# copyright 2026 by sleet.near
