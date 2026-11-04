# SHIT-1170 API KEY ME

`GET /api/shit-1170/api-key/me` - which account does this api key
belong to.

the first route that REQUIRES the api key. the key travels in the
`x-api-key` header, and the answer is the account the key belongs to.

it exists so the automatic key handling is real and not hypothetical: a
page that calls this route gets the key attached for it, and a request
with no key - or a key nobody has - is refused.

## THE HEADER

```
x-api-key: shit_1170_ab7fca21168a6961f47677dee81dc178cd0aa9b7146c38fa9c87c3bd1e0f8fc2
```

the key is in a HEADER and not in a query parameter: a url ends up in
logs, in the browser's history, and in the `referer` of the next page. a
bearer token belongs in a header.

## THE LEGACY HEADER

the old name is still accepted during the beta:

```
x-session-token: shit_1170_ab7fca21168a6961f47677dee81dc178cd0aa9b7146c38fa9c87c3bd1e0f8fc2
```

the backend reads **both** headers. `x-api-key` is read FIRST and the
old `x-session-token` is the fallback.

> --- WHY --- both names are accepted. the credential in it is not a
> browser session. the user signs in once and hands the key to an
> agent, and the agent holds it as a bearer token for as long as it
> lives. an agent built against `x-session-token` is out in the world
> already, and it would break the moment the backend stopped reading
> that header.

> --- WHY --- the NEW name wins when BOTH are present. the new name is
> the one the backend asks for, so if a caller sends both and they
> disagree, the new one is the answer. reading the old one first would
> let a stale key override the fresh one.

the header name is read case-insensitively - http header names are
case-insensitive and axum's `HeaderMap` already lowercases them, so
`x-api-key` and `X-Api-Key` are the same header.

the value is trimmed, and an EMPTY header counts as no header at all: an
empty value is not a key, and hashing it would look up a row that cannot
exist.

## THE ANSWER

`200`:

```json
{
  "accountId": "alice.near",
  "createdAt": 1793686862973,
  "updatedAt": 1793686868927
}
```

one account, because one key belongs to one account.

on failure it answers json in the shape
`{ "error": { "code", "message" } }`:

- `401` - `no_api_key` when the header is missing, or
  `unknown_api_key` when the key is not one of ours
- `500` - `db_unavailable` when the db could not be reached

## HOW THE KEY IS FOUND

the key is hashed with sha-256 and the hash is what is looked up, so
the request's key is never compared against anything in the db.

## CLIENT

the typed client lives in `middleman/src/`, published as
`@huggies/shit-1170-rex-engine-middleman`:
`api_shit_1170_api_key_me_get(base_url, options)` - where `options` is
`{ api_key }`.

the middleman cannot know the reader's key on its own: it is a plain
client with no browser state. the frontend attaches the key - see
`frontend/lib/ts/shared/api_key_token.ts`.

the middleman sends BOTH header names during the beta, with the same
value in each. sending two different values would be a way to lie about
which key is in play.

=====================
<br/>
copyright 2026 by sleet.near
