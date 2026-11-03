# bin/shit-1170

cli bins for our own backend, called through `middleman`.
one bin per route of ours, so a new route gets a new bin.

all commands are run from the project root.

## api_shit_1170_ping_get

GET /api/shit-1170/ping — liveness check. answers
`{ "ok": true, "app": "shit-1170" }`.

```sh
# defaults to http://127.0.0.1:54733
bun middleman/bin/shit-1170/api_shit_1170_ping_get.ts

# point at a different backend (staging / docker host / etc.)
bun middleman/bin/shit-1170/api_shit_1170_ping_get.ts --base-url http://my-host:54733
```

## api_trezu_treasuries_get

GET /api/trezu/user/treasuries — the treasuries (sputnik daos) an
account belongs to. the account id is required and is trimmed.
`--include-hidden` stands alone, it takes no value.

```sh
bun middleman/bin/shit-1170/api_trezu_treasuries_get.ts sleet.near
bun middleman/bin/shit-1170/api_trezu_treasuries_get.ts sleet.near --include-hidden
bun middleman/bin/shit-1170/api_trezu_treasuries_get.ts sleet.near --base-url http://my-host:54733
```

========================================
<br/>
copyright 2026 by sleet.near
