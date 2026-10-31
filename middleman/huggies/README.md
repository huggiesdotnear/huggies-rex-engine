# @huggies/middleman

clean ts library for interacting with the huggies-rex-engine backend routes.

```sh
bun i
bun run build
# publish
bun publish --dry-run
bunx npm login
bun publish --access public
# other
bun run typecheck
bunx prettier . --write
```

---

huggies-rex-engine
<br/>
https://shit-1170.com

the base url is a parameter on every call: the frontend passes the
origin of the page it is served from, a bin passes whatever backend it
was told to talk to (`--base-url`).

the routes covered here are the ones this backend owns:

- `/api/huggies/*` - our own routes, nothing is proxied
- `/api/trezu/*` - our proxy for the trezu api

the third-party apis the app talks to are NOT here. the intear api, the
intear dex backend and the rhea indexer each ship their own published
middleman package, so there is one client per api and one place to keep
it:

- `@sleet-js/middleman-intear-api` - `https://api.intea.rs`
- `@sleet-js/middleman-intear-dex-api` - `https://dex-backend.intear.tech`
- `@sleet-js/middleman-rhea-api` - `https://api.rhea.finance`

=====================
<br/>
copyright 2026 by sleet.near
