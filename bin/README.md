# bin

cli bins for talking to our own backend. every bin imports the
middleman wrapper (never `fetch`), so the framed request/response block
and the error handling are identical to what the frontend sees.

the bins are grouped by the api they talk to, mirroring the
middleman:

- [`bin/huggies/`](./huggies/README.md) — our own backend, through
  `middleman/huggies`.
- `bin/fun/` — bin primitives shared by the bins above.

each group has its own README with the example run commands.

the third-party apis are not binned here. the intear api, the intear
dex backend and the rhea indexer each ship their own bins inside their
published middleman package, so there is one bin per endpoint and one
place to keep it:

- `@sleet-js/middleman-intear-api` — `node_modules/@sleet-js/middleman-intear-api/bin`
- `@sleet-js/middleman-intear-dex-api` — `node_modules/@sleet-js/middleman-intear-dex-api/bin`
- `@sleet-js/middleman-rhea-api` — `node_modules/@sleet-js/middleman-rhea-api/bin`

bins accept positional args and `--flag value` pairs; when argv is
omitted, the defaults documented per bin are used. all commands are run
from the project root.

## NOTES

- **a flag that takes no value is listed by its bin.** `split_argv`
  takes the boolean flags as an argument, so `--desc` in one bin never
  swallows a positional in another bin.

========================================
<br/>
copyright 2026 by sleet.near
