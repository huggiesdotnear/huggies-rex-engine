# bin

cli bins for talking to our backend and to the intear api. every bin
imports the middleman wrapper (never `fetch`), so the framed
request/response block and the error handling are identical to what the
frontend sees.

the bins are grouped by the api they talk to, mirroring the
middleman:

- [`bin/intear/`](./intear/README.md) — the intear api, called directly
  from the browser. the api is public and has no auth, so these bins need
  no base url.
- [`bin/huggies/`](./huggies/README.md) — our own backend, through
  `middleman/huggies`.
- `bin/fun/` — bin primitives shared by the bins above.

each group has its own README with the example run commands.

bins accept positional args and `--flag value` pairs; when argv is
omitted, the defaults documented per bin are used. all commands are run
from the project root.

## NOTES

- **`--fields` / `--series` are validated before the request.** the
  bins fetch the live schema and reject an unknown name with the valid
  list, so a typo fails locally instead of burning an API call.
- **`limit` requires `sort` on `/tokens`.** passing one without the
  other is a 400 from the server; the error block prints it in full.
- **`/transfers` needs a party.** an unfiltered history is unbounded,
  so the api rejects it; the account id is therefore a required
  positional.
- **`/activity` fields are per-kind.** one `--fields` string is fanned
  out across the requested kinds, because a kind with no field list
  returns no rows at all.
- **`account_id` is never a `--fields` value.** it is the row's
  leading column on every token endpoint and is always returned.
- **`prices/at` cannot query the future.** a timestamp newer than the
  indexer's latest block returns `not_indexed`, with the latest
  indexed height in the message.
- **every response carries a `height`.** that is the indexer block the
  data came from, so it is the version of the answer — two endpoints
  called a second apart can legitimately disagree.
- **a flag that takes no value is listed by its bin.** `split_argv`
  takes the boolean flags as an argument, so `--desc` in one bin never
  swallows a positional in another bin.

========================================
<br/>
copyright 2026 by sleet.near
