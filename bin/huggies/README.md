# bin/huggies

cli bins for our own backend, called through `middleman/huggies`.
one bin per route of ours, so a new route gets a new bin.

all commands are run from the project root.

## api_huggies_ping_get

GET /api/huggies/ping — liveness check. answers
`{ "ok": true, "app": "huggies-rex-engine" }`.

```sh
# defaults to http://127.0.0.1:54733
bun bin/huggies/api_huggies_ping_get.ts

# point at a different backend (staging / docker host / etc.)
bun bin/huggies/api_huggies_ping_get.ts --base-url http://my-host:54733
```

## api_trezu_treasuries_get

GET /api/trezu/user/treasuries — the treasuries (sputnik daos) an
account belongs to. the account id is required and is trimmed.
`--include-hidden` stands alone, it takes no value.

```sh
bun bin/huggies/api_trezu_treasuries_get.ts sleet.near
bun bin/huggies/api_trezu_treasuries_get.ts sleet.near --include-hidden
bun bin/huggies/api_trezu_treasuries_get.ts sleet.near --base-url http://my-host:54733
```

========================================
<br/>
copyright 2026 by sleet.near
