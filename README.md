# huggies-rex-engine

💩 near agentic engine

bun/frontend

```sh
bun i
bunx prettier . --write
bun tsc --noEmit
# bun build recursive
rm -rf static
cd frontend
bun build ./**/*.html --outdir=../static --minify
```

rust/backend

```sh
cargo fmt
cargo check
cargo run
# cargo build
cargo build --release
./target/release/huggies-rex-engine
```

=====================
<br/>
copyright 2026 by sleet.near
